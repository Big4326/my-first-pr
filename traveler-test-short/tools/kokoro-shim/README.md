# Voice setup (kokoro-onnx)

The engine's voiceover expects the python `kokoro` package. This shim provides the same API using
`kokoro-onnx`, whose model files download from GitHub releases.

```bash
pip install kokoro-onnx soundfile
mkdir -p /root/tts && cd /root/tts
for f in kokoro-v1.0.onnx voices-v1.0.bin; do
  curl -sL -o $f https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$f
done
cd <project> && PYTHONPATH=tools/kokoro-shim node song.js
```
