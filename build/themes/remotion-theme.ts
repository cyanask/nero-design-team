export const remotionTheme = {
  "colors": {
    "brand": {
      "primary": "#1f4e5f",
      "secondary": "#6f4e37",
      "accent": "#c6a15b",
      "critical": "#9b2c2c"
    },
    "surface": {
      "canvas": "#f5f7f8",
      "paper": "#ffffff",
      "muted": "#eef2f3",
      "inverse": "#16212b"
    },
    "text": {
      "primary": "#1d252c",
      "secondary": "#53616b",
      "muted": "#667680",
      "inverse": "#f4f8fa"
    },
    "border": {
      "subtle": "#dce4e8",
      "strong": "#aebbc3"
    },
    "status": {
      "positive": "#087f5b",
      "warning": "#b7791f",
      "negative": "#b42318",
      "neutral": "#596a75"
    }
  },
  "typography": {
    "font": {
      "cn": {
        "body": "\"PingFang SC\", \"Microsoft YaHei\", \"Noto Sans SC\", system-ui, sans-serif",
        "display": "\"PingFang SC\", \"Microsoft YaHei\", \"Noto Sans SC\", system-ui, sans-serif"
      },
      "en": {
        "body": "Inter, Aptos, system-ui, sans-serif",
        "mono": "\"SFMono-Regular\", Consolas, \"Liberation Mono\", monospace"
      }
    },
    "type": {
      "display": {
        "size": "32px",
        "lineHeight": 1.16,
        "weight": 700
      },
      "title": {
        "size": "22px",
        "lineHeight": 1.22,
        "weight": 700
      },
      "subtitle": {
        "size": "16px",
        "lineHeight": 1.38,
        "weight": 600
      },
      "body": {
        "size": "14px",
        "lineHeight": 1.5,
        "weight": 400
      },
      "caption": {
        "size": "12px",
        "lineHeight": 1.45,
        "weight": 400
      },
      "metric": {
        "size": "34px",
        "lineHeight": 1.05,
        "weight": 700
      }
    }
  },
  "spacing": {
    "safeInset": "88px",
    "blockGap": "52px"
  },
  "motion": {
    "duration": {
      "fast": "120ms",
      "base": "180ms",
      "slow": "320ms",
      "scene": 24
    },
    "easing": {
      "standard": "cubic-bezier(0.2, 0, 0, 1)",
      "enter": "cubic-bezier(0.16, 1, 0.3, 1)",
      "exit": "cubic-bezier(0.7, 0, 0.84, 0)"
    }
  },
  "chart": {
    "palette": {
      "categorical": [
        "#1f4e5f",
        "#c6a15b",
        "#6f4e37",
        "#087f5b",
        "#596a75",
        "#9b2c2c"
      ],
      "sequential": [
        "#e8f1f3",
        "#b8d1d8",
        "#78a7b4",
        "#3f7585",
        "#1f4e5f"
      ],
      "risk": [
        "#087f5b",
        "#b7791f",
        "#b42318"
      ]
    },
    "axis": {
      "label": "#53616b",
      "line": "#dce4e8",
      "grid": "#e8edf0"
    },
    "annotation": {
      "fill": "#fff8e7",
      "stroke": "#c6a15b",
      "text": "#1d252c"
    }
  }
} as const;
