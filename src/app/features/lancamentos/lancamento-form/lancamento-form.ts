import { Component, input, output, OnInit, signal, computed } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CategoriaService } from '../../../core/services/categoria.service';
import { Categoria } from '../../../models/categoria.model';
import { LancamentoService } from '../../../core/services/lancamento.service';
import { LancamentoRequest } from '../../../models/lancamento.model';

@Component({
  selector: 'app-lancamento-form',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './lancamento-form.html'
})
export class LancamentoForm implements OnInit {
  usuarioId = input.required<number>();
  salvou = output<void>();
  categorias = signal<Categoria[]>([]);
  categoriasAtivas = computed(() => this.categorias().filter(c => c.ativa));
  erro = signal('');
  salvando = signal(false);

  formulario = new FormGroup({
    descricao: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(200)
      ]
    }),
    valor: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0.01)
    ]),
    dataLancamento: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    observacao: new FormControl('', { nonNullable: true }),
    categoriaId: new FormControl<number | null>(null, [Validators.required])
  });

  constructor(
    private categoriasService: CategoriaService,
    private lancamentosService: LancamentoService
  ) {}

  ngOnInit(): void {
    this.categoriasService.listar().subscribe({
      next: dados => this.categorias.set(dados),
      error: () => this.erro.set('Falha ao carregar categorias.')
    });
  }

  salvar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const v = this.formulario.getRawValue();
    const dados: LancamentoRequest = {
      descricao: v.descricao.trim(),
      valor: v.valor!,
      dataLancamento: v.dataLancamento,
      observacao: v.observacao || null,
      categoriaId: v.categoriaId!
    };

    this.salvando.set(true);
    this.erro.set('');

    this.lancamentosService.cadastrar(this.usuarioId(), dados).subscribe({
      next: () => {
        this.salvando.set(false);
        this.formulario.reset();
        this.salvou.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.salvando.set(false);

        if (err.status === 400) {
          this.erro.set(err.error?.erro || 'Dados inválidos. Revise os campos.');
        } else if (err.status === 404) {
          this.erro.set('Usuário ou categoria não encontrado.');
        } else if (err.status === 415) {
          this.erro.set('Tipo de conteúdo inválido na requisição.');
        } else if (err.status === 0) {
          this.erro.set('Falha de conexão. Verifique o servidor e o CORS.');
        } else {
          this.erro.set(err.error?.erro || 'Não foi possível salvar.');
        }
      }
    });
  }
}
