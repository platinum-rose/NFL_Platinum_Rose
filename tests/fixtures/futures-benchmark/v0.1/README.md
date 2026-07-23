# Futures Benchmark v0.1

This package is a held-out shadow benchmark scaffold for the futures analyst.

The non-outcome suites use compact `case_groups`: each group declares a frozen
count, mutation family, and expected gate behavior. These cases test contracts,
validator behavior, portfolio construction, scenario roles, and personalization
policy without calling a model or touching live systems.

`forecast_market.json` is intentionally unresolved. It must only count real
closing-line or settled futures observations. Do not fill it with synthetic
outcomes just to satisfy the benchmark minimum.

Expected shadow verdict until real observations exist:

```text
SHADOW ONLY - INSUFFICIENT EVIDENCE
```
