import {
  BarChart3,
  Bell,
  CheckCircle2,
  Filter,
  Search,
  Settings,
  TrendingUp
} from "lucide-react";

const metrics = [
  { label: "AI 产业链事件", value: "42", delta: "+8", tone: "positive" },
  { label: "需复核公司", value: "11", delta: "-3", tone: "neutral" },
  { label: "高影响信号", value: "7", delta: "+2", tone: "positive" }
];

const rows = [
  ["光模块", "订单能见度提升", "高", "已核对来源"],
  ["先进封装", "CapEx 节奏分化", "中", "需补充口径"],
  ["HBM", "价格维持强势", "高", "跟踪中"],
  ["电源管理", "库存修复", "中", "已核对来源"]
];

export function App() {
  return (
    <main
      className="app-shell"
      data-design-route="shadcn-ui baseline; Carbon dense analytics; Ant Design complex forms and tables"
    >
      <aside className="sidebar" aria-label="Workspace">
        <div className="brand">NERO</div>
        <nav>
          <a className="active" href="#overview">
            <BarChart3 size={18} />
            <span>产业看板</span>
          </a>
          <a href="#signals">
            <TrendingUp size={18} />
            <span>信号池</span>
          </a>
          <a href="#review">
            <CheckCircle2 size={18} />
            <span>复核队列</span>
          </a>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">AI Industry Research</p>
            <h1>产业信号工作台</h1>
          </div>
          <div className="actions">
            <button aria-label="Search">
              <Search size={18} />
            </button>
            <button aria-label="Filter">
              <Filter size={18} />
            </button>
            <button aria-label="Notifications">
              <Bell size={18} />
            </button>
            <button aria-label="Settings">
              <Settings size={18} />
            </button>
          </div>
        </header>

        <section className="metrics" aria-label="Key metrics">
          {metrics.map((metric) => (
            <article className="metric" key={metric.label}>
              <p>{metric.label}</p>
              <div>
                <strong>{metric.value}</strong>
                <span className={metric.tone}>{metric.delta}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>今日重点链条</h2>
              <p>按影响强度、证据状态和复核优先级排序</p>
            </div>
            <button className="text-button">导出</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>链条</th>
                  <th>核心变化</th>
                  <th>影响</th>
                  <th>证据状态</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell) => (
                      <td key={cell}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
