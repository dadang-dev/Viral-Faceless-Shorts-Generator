import argparse
from pathlib import Path

import yaml

from pauseflow.pipeline import PauseFlowPipeline


def load_config(path: str = "config.yaml") -> dict:
    with open(path, "r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def parse_days(value: str) -> list[int]:
    if value.lower() == "all":
        return list(range(1, 8))
    days = sorted({int(item.strip()) for item in value.split(",") if item.strip()})
    if not days or any(day not in range(1, 8) for day in days):
        raise argparse.ArgumentTypeError("days must be 'all' or comma-separated values from 1 to 7")
    return days


def main() -> None:
    parser = argparse.ArgumentParser(description="Money Habits production pipeline")
    parser.add_argument("command", choices=("prepare", "status", "render"))
    parser.add_argument("--days", type=parse_days, default=list(range(1, 8)))
    parser.add_argument(
        "--regenerate-audio",
        action="store_true",
        help="Generate Edge TTS + Whisper again instead of reusing locked v3 artifacts",
    )
    args = parser.parse_args()
    pipeline = PauseFlowPipeline(load_config(), root=Path(__file__).resolve().parent)

    if args.command == "prepare":
        pipeline.prepare(args.days, regenerate_audio=args.regenerate_audio)
    elif args.command == "render":
        pipeline.render(args.days)
    else:
        for item in pipeline.status(args.days):
            print(
                f"Day {item['day']}: prepared={item['prepared']} "
                f"clips={item['clips']} rendered={item['rendered']}"
            )


if __name__ == "__main__":
    main()
