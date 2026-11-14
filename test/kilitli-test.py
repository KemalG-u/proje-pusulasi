import os, sys, time, msvcrt, subprocess
from pathlib import Path
root = Path(__file__).resolve().parent.parent
lock = Path("E:/AI/projeler/github-portfoy/test-kapisi/portfoy-seri-isci.lock")
with lock.open("a+b") as f:
    while True:
        try:
            f.seek(0); msvcrt.locking(f.fileno(), msvcrt.LK_NBLCK, 1); break
        except OSError:
            time.sleep(2)
    try:
        env = os.environ.copy()
        env.update(AGIR_KAPATMA="0", AGIR_BAYAT_TEMIZLE="0", AGIR_SURE="0", AGIR_ANAHTAR="portfoy-seri-proje-pusulasi")
        command = sys.argv[1:] or ["node", "--test", "test/app.test.js", "test/e2e.test.js"]
        result = subprocess.run(["C:/Program Files/Git/bin/bash.exe", "D:/antigravity/_tmp/r133-kilit/agir.sh", "pusula", *command], cwd=root, env=env)
    finally:
        f.seek(0); msvcrt.locking(f.fileno(), msvcrt.LK_UNLCK, 1)
    sys.exit(result.returncode)
