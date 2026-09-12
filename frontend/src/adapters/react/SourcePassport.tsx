import type { ReadEnvelope } from "../../core/contracts";
import {
  authorityLabel,
  projectionLabel,
  sourceStateLabel
} from "../../packs/ndt/pack";

type Props = {
  envelope: ReadEnvelope<unknown>;
};

export function SourcePassport({ envelope }: Props) {
  return (
    <section className="source-passport" aria-label="来源护照">
      <div>
        <span className="section-label">来源与更新时间</span>
        <strong>{authorityLabel(envelope.state)}</strong>
      </div>
      <dl>
        <div>
          <dt>数据类型</dt>
          <dd>{projectionLabel(envelope.state)}</dd>
        </div>
        <div>
          <dt>版本</dt>
          <dd>{envelope.source.sourceVersion ?? "unknown"}</dd>
        </div>
        <div>
          <dt>读取时状态</dt>
          <dd>{sourceStateLabel(envelope.state)}</dd>
        </div>
        <div>
          <dt>读取时间</dt>
          <dd>{new Date(envelope.observedAt).toLocaleString("zh-CN", { hour12: false })}</dd>
        </div>
      </dl>
    </section>
  );
}
