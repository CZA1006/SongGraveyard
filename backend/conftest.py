"""保证从任意 cwd 运行 pytest 都能 import app(把 backend/ 放进 sys.path)。"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
