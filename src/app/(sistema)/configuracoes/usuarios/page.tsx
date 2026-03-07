import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDateTime, roleLabel } from '@/lib/utils'
import { UserRoleForm } from './user-role-form'

export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('name')

  return (
    <div>
      <PageHeader
        title="Usuários e Permissões"
        description="Gerencie os acessos ao sistema"
      />

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
        <p className="font-semibold mb-1">Como criar novos usuários:</p>
        <ol className="list-decimal list-inside space-y-1 text-amber-700">
          <li>Acesse o painel do Supabase → Authentication → Users</li>
          <li>Clique em "Invite user" e informe o email</li>
          <li>O perfil será criado automaticamente no sistema</li>
          <li>Defina o perfil (Administrador, Gerente, Caixa, Estoquista) abaixo</li>
        </ol>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                    <th className="px-4 py-3">Usuário</th>
                    <th className="px-4 py-3">Perfil</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Cadastrado em</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(profiles ?? []).map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-700 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <p className="font-medium text-gray-800">{p.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          p.role === 'administrador' ? 'bg-purple-100 text-purple-700' :
                          p.role === 'gerente' ? 'bg-blue-100 text-blue-700' :
                          p.role === 'caixa' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {roleLabel(p.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.active ? 'ativo' : 'inativo'} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{formatDateTime(p.created_at)}</td>
                    </tr>
                  ))}
                  {(profiles ?? []).length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-gray-400">Nenhum usuário encontrado</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Alterar perfil */}
        <div>
          <UserRoleForm profiles={profiles ?? []} />
        </div>
      </div>

      {/* Permissões por perfil */}
      <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Permissões por Perfil</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          {[
            { role: 'Administrador', color: 'purple', perms: ['Acesso total', 'Configurações', 'Relatórios DRE', 'Excluir registros', 'Gerenciar usuários'] },
            { role: 'Gerente', color: 'blue', perms: ['PDV + Cancelar vendas', 'Todos os caixas', 'Contas a pagar/receber', 'Estoque completo', 'Relatórios gerais'] },
            { role: 'Caixa', color: 'green', perms: ['PDV (abrir/fechar caixa próprio)', 'Ver fiado do cliente', 'Receber pagamentos de fiado'] },
            { role: 'Estoquista', color: 'gray', perms: ['Cadastro de produtos', 'Movimentações de estoque', 'Cadastro de fornecedores'] },
          ].map(({ role, color, perms }) => (
            <div key={role} className={`p-3 rounded-xl border bg-${color}-50 border-${color}-100`}>
              <p className={`font-semibold text-${color}-700 mb-2`}>{role}</p>
              <ul className="space-y-1">
                {perms.map(p => (
                  <li key={p} className="text-xs text-gray-600 flex items-start gap-1">
                    <span className="text-green-500 flex-shrink-0">✓</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
