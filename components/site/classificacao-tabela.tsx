import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { ClassifCamp } from "@/lib/site/classificacao"

/** Tabela de classificação FPFS de uma categoria, com a linha do clube destacada. */
export function ClassificacaoTabela({ camp }: { camp: ClassifCamp }) {
  return (
    <div className="classif">
      {camp.fpfsSyncEm && (
        <p className="classif-sync">
          Atualizada em {format(new Date(camp.fpfsSyncEm), "dd/MM 'às' HH:mm", { locale: ptBR })}
        </p>
      )}
      <div className="classif-wrap">
        <table className="classif-tbl">
          <thead>
            <tr>
              <th scope="col"><abbr title="Posição">#</abbr></th>
              <th scope="col">Time</th>
              <th scope="col"><abbr title="Pontos">Pts</abbr></th>
              <th scope="col"><abbr title="Jogos">J</abbr></th>
              <th scope="col"><abbr title="Vitórias">V</abbr></th>
              <th scope="col"><abbr title="Empates">E</abbr></th>
              <th scope="col"><abbr title="Derrotas">D</abbr></th>
              <th scope="col"><abbr title="Gols pró">GP</abbr></th>
              <th scope="col"><abbr title="Gols contra">GC</abbr></th>
              <th scope="col"><abbr title="Saldo de gols">SG</abbr></th>
            </tr>
          </thead>
          <tbody data-numeric>
            {camp.linhas.map((l) => (
              <tr key={l.id} className={l.ehNosso ? "is-nosso" : undefined}>
                <td>{l.posicao}</td>
                <th scope="row">{l.timeNome}</th>
                <td className="classif-pts">{l.pontos}</td>
                <td>{l.jogos}</td>
                <td>{l.vitorias}</td>
                <td>{l.empates}</td>
                <td>{l.derrotas}</td>
                <td>{l.golsPro}</td>
                <td>{l.golsContra}</td>
                <td>{l.saldo > 0 ? `+${l.saldo}` : l.saldo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
