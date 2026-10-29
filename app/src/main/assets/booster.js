(function () {
  if (window.__dxMaster) return;
  window.__dxMaster = true;

  var md = navigator.mediaDevices;
  if (!md || !md.getUserMedia) return;

  var S = { gain: 1.5, micOn: true, eq: 'clear' };
  var ctx, gainNode, bass, mid, treble, panel, label, micBtn;

  var EQ = {
    normal: { b: 0, m: 0, t: 0 },
    clear: { b: -2, m: 6, t: 4 },
    bass: { b: 8, m: 1, t: 0 }
  };

  function applyEq() {
    if (!bass) return;
    var e = EQ[S.eq];
    bass.gain.value = e.b;
    mid.gain.value = e.m;
    treble.gain.value = e.t;
  }

  function applyGain() {
    if (gainNode) gainNode.gain.value = S.micOn ? S.gain : 0;
    if (label) label.textContent = Math.round(S.gain * 100) + '%';
    if (micBtn) {
      micBtn.textContent = S.micOn ? 'MIC ON' : 'MIC OFF';
      micBtn.style.background = S.micOn ? '#16a34a' : '#dc2626';
    }
  }

  var origGUM = md.getUserMedia.bind(md);

  md.getUserMedia = async function (c) {
    var stream = await origGUM(c);
    if (!c || !c.audio || stream.getAudioTracks().length === 0) return stream;

    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      var src = ctx.createMediaStreamSource(new MediaStream(stream.getAudioTracks()));

      var hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 80;

      bass = ctx.createBiquadFilter();
      bass.type = 'lowshelf';
      bass.frequency.value = 150;

      mid = ctx.createBiquadFilter();
      mid.type = 'peaking';
      mid.frequency.value = 2500;
      mid.Q.value = 1;

      treble = ctx.createBiquadFilter();
      treble.type = 'highshelf';
      treble.frequency.value = 6000;

      gainNode = ctx.createGain();

      var comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -20;
      comp.knee.value = 25;
      comp.ratio.value = 12;
      comp.attack.value = 0.003;
      comp.release.value = 0.2;

      var dest = ctx.createMediaStreamDestination();

      src.connect(hp);
      hp.connect(bass);
      bass.connect(mid);
      mid.connect(treble);
      treble.connect(gainNode);
      gainNode.connect(comp);
      comp.connect(dest);

      applyEq();
      applyGain();
      if (ctx.state === 'suspended') ctx.resume();

      var out = dest.stream;
      stream.getVideoTracks().forEach(function (t) { out.addTrack(t); });

      showPanel(true);
      return out;
    } catch (e) {
      return stream;
    }
  };

  function btn(text, bg, fn) {
    var b = document.createElement('button');
    b.textContent = text;
    b.style.cssText = 'flex:1;margin:3px;padding:12px 6px;border:0;border-radius:10px;'
      + 'color:#fff;font-size:15px;font-weight:bold;background:' + bg;
    b.onclick = function () {
      if (ctx && ctx.state === 'suspended') ctx.resume();
      fn();
    };
    return b;
  }

  function row() {
    var r = document.createElement('div');
    r.style.cssText = 'display:flex;margin-top:6px';
    return r;
  }

  function build() {
    if (panel || !document.body) return;

    var fab = document.createElement('div');
    fab.textContent = 'MIC';
    fab.style.cssText = 'position:fixed;top:8px;right:8px;width:46px;height:46px;'
      + 'border-radius:50%;background:#111;color:#22d3ee;font-size:12px;font-weight:bold;'
      + 'display:flex;align-items:center;justify-content:center;z-index:2147483647;'
      + 'box-shadow:0 2px 10px #0008;border:2px solid #22d3ee';
    fab.onclick = function () { showPanel(panel.style.display === 'none'); };

    panel = document.createElement('div');
    panel.style.cssText = 'position:fixed;top:60px;right:8px;width:250px;padding:12px;'
      + 'background:#0b1220;border:2px solid #22d3ee;border-radius:14px;'
      + 'z-index:2147483647;display:none;font-family:sans-serif;color:#fff;'
      + 'box-shadow:0 4px 20px #000a';

    var title = document.createElement('div');
    title.textContent = 'DX MASTER';
    title.style.cssText = 'text-align:center;font-size:22px;font-weight:900;'
      + 'letter-spacing:3px;color:#22d3ee;text-shadow:0 0 8px #22d3ee';
    panel.appendChild(title);

    label = document.createElement('div');
    label.style.cssText = 'text-align:center;font-size:30px;font-weight:bold;margin:8px 0';
    panel.appendChild(label);

    var r1 = row();
    r1.appendChild(btn('- DOWN', '#2563eb', function () {
      S.gain = Math.max(0, +(S.gain - 0.25).toFixed(2));
      applyGain();
    }));
    r1.appendChild(btn('+ UP', '#2563eb', function () {
      S.gain = Math.min(3, +(S.gain + 0.25).toFixed(2));
      applyGain();
    }));
    panel.appendChild(r1);

    var r2 = row();
    micBtn = btn('', '#16a34a', function () {
      S.micOn = !S.micOn;
      applyGain();
    });
    r2.appendChild(micBtn);
    panel.appendChild(r2);

    var r3 = row();
    r3.appendChild(btn('Normal', '#475569', function () { S.eq = 'normal'; applyEq(); }));
    r3.appendChild(btn('Clear', '#475569', function () { S.eq = 'clear'; applyEq(); }));
    r3.appendChild(btn('Bass', '#475569', function () { S.eq = 'bass'; applyEq(); }));
    panel.appendChild(r3);

    document.body.appendChild(fab);
    document.body.appendChild(panel);
    applyGain();
  }

  function showPanel(v) {
    build();
    if (panel) panel.style.display = v ? 'block' : 'none';
  }

  var t = setInterval(function () {
    if (document.body) {
      build();
      clearInterval(t);
    }
  }, 300);
})();
