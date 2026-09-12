# AI App UI Preset QA

- `frontend_profile` resolves to `ai-app-ui` and loads the NDT rule.
- The project design intent validates against `design-intent.schema.json`.
- Every applicable state is represented or has a recorded exemption.
- Partial, completed and verified results remain visibly distinct.
- Waiting and high-impact states name the required user decision.
- Confirm, reject, cancel, retry and takeover controls change a real state in the sample or are explicitly disabled.
- Sources, unknowns and history use clearly labelled example content; they are not presented as real evidence.
- Keyboard focus, `aria-live`, contrast, declared desktop layouts and reduced-motion behavior are checked.
- Mobile/tablet layouts are unsupported and must not be represented as accepted NDT output.
- The route-specific score manifest uses `ai-app-ui-scorecard.json`.
- Static checks report `design_contract_passed` only. Rendered QA, live behavior and human acceptance remain separate.
