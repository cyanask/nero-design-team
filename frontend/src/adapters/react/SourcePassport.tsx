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
        <span className="section-label">SOURCE PASSPORT</span>
        <strong>{authorityLabel(envelope.state)}</strong>
      </div>
      <dl>
        <div>
          <dt>投影</dt>
          <dd>{projectionLabel(envelope.state)}</dd>
        </div>
        <div>
          <dt>版本</dt>
          <dd>{envelope.source.sourceVersion ?? "unknown"}</dd>
        </div>
        <div>
          <dt>观测</dt>
          <dd>{sourceStateLabel(envelope.state)}</dd>
        </div>
        <div>
          <dt>时间</dt>
          <dd>{new Date(envelope.observedAt).toLocaleString("zh-CN", { hour12: false })}</dd>
        </div>
      </dl>
    </section>
  );
}
