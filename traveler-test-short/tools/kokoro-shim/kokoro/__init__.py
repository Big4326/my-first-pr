# Shim: exposes the KPipeline API the animation engine expects, backed by kokoro-onnx (local model files).
import numpy as np
from kokoro_onnx import Kokoro
_K = None
class _R:
    def __init__(self, a): self.audio = a
class KPipeline:
    def __init__(self, lang_code='a', **kw):
        global _K
        if _K is None: _K = Kokoro('/root/tts/kokoro-v1.0.onnx', '/root/tts/voices-v1.0.bin')
        self.lang = 'en-gb' if lang_code == 'b' else 'en-us'
    def __call__(self, text, voice='am_michael', speed=1.0, **kw):
        s, sr = _K.create(text, voice=voice, speed=float(speed), lang=self.lang)
        yield _R(np.asarray(s, dtype=np.float32))
