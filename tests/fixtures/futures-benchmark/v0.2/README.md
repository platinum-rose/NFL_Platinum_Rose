# Futures Benchmark v0.2

This is the first explicit shadow-evaluation package for the NFL futures analyst.

The goal is to score what can be tested offline today while preserving the hard
boundary around real-money use. Mechanical, semantic, adversarial, portfolio, and
personalization cases are frozen here. Forecast and CLV observations must come
from real closing lines or settled outcomes; synthetic rows are allowed only as
collection targets and do not count toward promotion evidence.

Expected verdict until real forecast/CLV observations are collected:

```text
SHADOW ONLY - INSUFFICIENT EVIDENCE
```

Use:

```powershell
npm.cmd run benchmark:futures -- --suite full --repeats 5 --no-persist --manifest tests/fixtures/futures-benchmark/v0.2/manifest.json
```

