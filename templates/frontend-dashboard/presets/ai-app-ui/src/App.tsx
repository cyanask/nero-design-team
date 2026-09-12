import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileText,
  History,
  Play,
  RotateCcw,
  ShieldCheck,
  Square,
  UserCheck,
  Wrench
} from "lucide-react";
import { useMemo, useState } from "react";

const states = [
  { id: "idle", label: "待开始", detail: "当前没有任务运行。", tone: "neutral" },
  { id: "planning", label: "计划中", detail: "计划仍是候选，尚未开始执行。", tone: "neutral" },
  { id: "running", label: "执行中", detail: "正在执行第 2 步；预计剩余时间未知。", tone: "active" },
  { id: "waiting_user", label: "等待输入", detail: "需要用户补充一个明确输入后才能继续。", tone: "waiting" },
  { id: "waiting_approval", label: "等待确认", detail: "一个示例高影响动作正在等待确认。", tone: "waiting" },
  { id: "partial", label: "部分完成", detail: "已有部分输出，其余步骤仍未完成。", tone: "partial" },
  { id: "completed", label: "已完成", detail: "操作已经结束；尚未代表验证通过。", tone: "positive" },
  { id: "verified", label: "已验证", detail: "独立的示例检查已经通过。", tone: "positive" },
  { id: "failed", label: "失败", detail: "示例工具调用失败，可以重试或转人工。", tone: "negative" },
  { id: "cancelled", label: "已取消", detail: "任务已停止，没有被标记为完成。", tone: "neutral" }
] as const;

type StateId = (typeof states)[number]["id"];

const historyItems = [
  { time: "10:02", title: "用户提交示例任务", meta: "输入已记录" },
  { time: "10:03", title: "生成候选计划", meta: "尚未执行" },
  { time: "10:04", title: "请求确认示例动作", meta: "当前暂停" }
];

export function App() {
  const [activeState, setActiveState] = useState<StateId>("waiting_approval");
  const current = useMemo(() => states.find((state) => state.id === activeState) ?? states[0], [activeState]);

  function approve() {
    setActiveState("running");
  }

  function reject() {
    setActiveState("cancelled");
  }

  function retry() {
    setActiveState("running");
  }

  return (
    <main className="agent-shell" data-frontend-profile="ai-app-ui">
      <aside className="state-rail" aria-label="示例状态目录">
        <div className="brand-block">
          <span>NDT</span>
          <strong>AI App UI</strong>
          <small>无业务数据状态模板</small>
        </div>
        <nav>
          {states.map((state) => (
            <button
              className={state.id === activeState ? "state-link active" : "state-link"}
              key={state.id}
              onClick={() => setActiveState(state.id)}
              type="button"
            >
              <span className={`state-dot ${state.tone}`} aria-hidden="true" />
              <span>{state.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="agent-workspace">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">示例任务 · 设计合同预览</p>
            <h1>审阅任务状态、依据与下一步动作</h1>
          </div>
          <span className={`status-badge ${current.tone}`} aria-live="polite">
            {current.label}
          </span>
        </header>

        <section className="capability-strip" aria-label="能力边界">
          <ShieldCheck size={18} aria-hidden="true" />
          <div>
            <strong>能力边界</strong>
            <p>可以展示候选计划和示例状态；不会执行真实外部动作，也不会把示例来源当成证据。</p>
          </div>
        </section>

        <div className="workspace-grid">
          <section className="primary-column">
            <article className="panel state-panel">
              <div className="panel-heading">
                <div>
                  <p className="section-label">当前状态</p>
                  <h2>{current.label}</h2>
                </div>
                <Clock3 size={20} aria-hidden="true" />
              </div>
              <p className="state-detail" aria-live="polite">{current.detail}</p>

              {activeState === "waiting_approval" && (
                <div className="approval-box">
                  <div>
                    <strong>待确认：执行示例外部动作</strong>
                    <p>目标、范围和影响均为占位说明；此模板不会连接真实系统。</p>
                  </div>
                  <dl>
                    <div><dt>目标</dt><dd>示例对象</dd></div>
                    <div><dt>范围</dt><dd>单个示例任务</dd></div>
                    <div><dt>恢复</dt><dd>拒绝后转为已取消</dd></div>
                  </dl>
                  <div className="button-row">
                    <button className="secondary-button" onClick={reject} type="button">
                      <Square size={16} aria-hidden="true" />拒绝
                    </button>
                    <button className="primary-button" onClick={approve} type="button">
                      <Play size={16} aria-hidden="true" />确认示例执行
                    </button>
                  </div>
                </div>
              )}

              {activeState === "failed" && (
                <div className="failure-box">
                  <CircleAlert size={20} aria-hidden="true" />
                  <div>
                    <strong>示例工具调用失败</strong>
                    <p>没有产生外部写入。可以重试或由人工继续处理。</p>
                  </div>
                  <button className="secondary-button" onClick={retry} type="button">
                    <RotateCcw size={16} aria-hidden="true" />重试
                  </button>
                </div>
              )}
            </article>

            <article className="panel output-panel">
              <div className="panel-heading">
                <div>
                  <p className="section-label">候选输出</p>
                  <h2>结果预览</h2>
                </div>
                <FileText size={20} aria-hidden="true" />
              </div>
              <div className="output-copy">
                <p><strong>示例结论：</strong>这里只展示界面结构，不包含真实业务判断。</p>
                <p>部分输出、最终完成和验证通过应使用不同状态，并保留对应的下一步操作。</p>
              </div>
            </article>
          </section>

          <aside className="evidence-column">
            <article className="panel">
              <div className="panel-heading compact">
                <div>
                  <p className="section-label">依据</p>
                  <h2>来源与未知项</h2>
                </div>
                <Wrench size={19} aria-hidden="true" />
              </div>
              <ul className="evidence-list">
                <li><span>示例来源 A</span><small>明确标注为占位</small></li>
                <li><span>示例来源 B</span><small>尚未核验</small></li>
                <li><span>未知项</span><small>真实运行状态未观察</small></li>
              </ul>
            </article>

            <article className="panel">
              <div className="panel-heading compact">
                <div>
                  <p className="section-label">可追溯性</p>
                  <h2>行动历史</h2>
                </div>
                <History size={19} aria-hidden="true" />
              </div>
              <ol className="history-list">
                {historyItems.map((item) => (
                  <li key={`${item.time}-${item.title}`}>
                    <time>{item.time}</time>
                    <div><strong>{item.title}</strong><small>{item.meta}</small></div>
                  </li>
                ))}
              </ol>
            </article>

            <article className="panel boundary-panel">
              <CheckCircle2 size={19} aria-hidden="true" />
              <div>
                <strong>当前证据上限</strong>
                <p>仅表示设计合同已接入。渲染、真实行为和人工验收仍待执行。</p>
              </div>
              <UserCheck size={19} aria-hidden="true" />
            </article>
          </aside>
        </div>
      </section>
    </main>
  );
}
