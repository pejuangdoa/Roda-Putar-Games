(function () {
     var COLORS = ['#8f2d3a', '#c9973c', '#1f6f6b', '#3b4a8f', '#6d3a7a', '#2f7d4f', '#b5543a', '#2d5f8f'];
     var PRESETS = {
          kelas: ['Amelia', 'Ben', 'Brandon', 'Isla', 'Jacob', 'Jenny', 'Macy', 'Sarah'],
          undian: ['Voucher Rp500.000', 'Tumbler', 'Kaos eksklusif', 'Diskon 50%', 'Power bank', 'Kopi gratis', 'Coba lagi', 'Hadiah utama'],
          standup: ['Andi', 'Budi', 'Citra', 'Dewi', 'Eka', 'Fajar'],
          makan: ['Nasi goreng', 'Sate', 'Bakso', 'Mie ayam', 'Pizza', 'Soto', 'Gado-gado']
     };
     var $ = function (id) {
          return document.getElementById(id)
     };
     var canvas = $('wheel'),
          ctx = canvas.getContext('2d');
     var names = [],
          rotation = 0,
          spinning = false,
          lastWinner = null,
          history = [],
          size = 560,
          audioCtx = null;
     var TAU = Math.PI * 2;

     function load() {
          try {
               var d = JSON.parse(localStorage.getItem('roda-nama') || 'null');
               if (d && d.names && d.names.length) {
                    $('names').value = d.names.join('\n');
                    history = d.history || [];
                    return
               }
          } catch (e) {}
          $('names').value = PRESETS.kelas.join('\n');
     }

     function save() {
          try {
               localStorage.setItem('roda-nama', JSON.stringify({
                    names: names,
                    history: history
               }))
          } catch (e) {}
     }

     function parse() {
          names = $('names').value.split('\n').map(function (s) {
               return s.trim()
          }).filter(Boolean).slice(0, 200);
          $('count').textContent = names.length + ' entri';
          $('spin').disabled = spinning || names.length < 2;
          draw();
          save();
     }

     function resize() {
          var r = canvas.getBoundingClientRect(),
               dpr = window.devicePixelRatio || 1;
          size = r.width;
          canvas.width = size * dpr;
          canvas.height = size * dpr;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          draw();
     }

     function draw() {
          var c = size / 2,
               R = c - 10,
               n = names.length;
          ctx.clearRect(0, 0, size, size);
          // outer ring
          ctx.beginPath();
          ctx.arc(c, c, c - 2, 0, TAU);
          ctx.fillStyle = '#d4b06a';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(c, c, R + 3, 0, TAU);
          ctx.fillStyle = '#0d0e13';
          ctx.fill();
          if (n < 1) {
               ctx.fillStyle = '#8d8fa0';
               ctx.font = '500 18px Manrope,sans-serif';
               ctx.textAlign = 'center';
               ctx.fillText('Tambahkan entri', c, c);
               return
          }
          var s = TAU / n;
          for (var i = 0; i < n; i++) {
               var a = rotation + i * s;
               ctx.beginPath();
               ctx.moveTo(c, c);
               ctx.arc(c, c, R, a, a + s);
               ctx.closePath();
               ctx.fillStyle = COLORS[i % COLORS.length];
               if (n > 1 && n % COLORS.length === 1 && i === n - 1) ctx.fillStyle = '#4a4d5e';
               ctx.fill();
               ctx.strokeStyle = 'rgba(13,14,19,.55)';
               ctx.lineWidth = 1.5;
               ctx.stroke();
               // label
               ctx.save();
               ctx.translate(c, c);
               ctx.rotate(a + s / 2);
               var fs = Math.max(10, Math.min(26, R * s * 0.42, R * 0.085 * (n < 12 ? 1.6 : 1)));
               ctx.font = '600 ' + fs + 'px Manrope,sans-serif';
               var label = names[i],
                    maxW = R * 0.62;
               while (ctx.measureText(label).width > maxW && label.length > 3) label = label.slice(0, -2);
               if (label !== names[i]) label = label.trimEnd() + '…';
               ctx.textAlign = 'right';
               ctx.textBaseline = 'middle';
               ctx.fillStyle = '#fff';
               ctx.shadowColor = 'rgba(0,0,0,.45)';
               ctx.shadowBlur = 3;
               ctx.fillText(label, R - 18, 0);
               ctx.restore();
          }
          // inner shade ring
          ctx.beginPath();
          ctx.arc(c, c, R, 0, TAU);
          ctx.strokeStyle = 'rgba(212,176,106,.5)';
          ctx.lineWidth = 2;
          ctx.stroke();
          // pegs
          for (var j = 0; j < n && n <= 60; j++) {
               var pa = rotation + j * s;
               ctx.beginPath();
               ctx.arc(c + Math.cos(pa) * (R + 1), c + Math.sin(pa) * (R + 1), 3, 0, TAU);
               ctx.fillStyle = '#f0d9a0';
               ctx.fill();
          }
     }

     function indexAt(rot) {
          var s = TAU / names.length,
               x = ((3 * Math.PI / 2 - rot) % TAU + TAU) % TAU;
          return Math.floor(x / s) % names.length;
     }

     function tick() {
          if (!$('sound').checked) return;
          try {
               audioCtx = audioCtx || new(window.AudioContext || window.webkitAudioContext)();
               var o = audioCtx.createOscillator(),
                    g = audioCtx.createGain();
               o.type = 'triangle';
               o.frequency.value = 880;
               g.gain.value = .05;
               g.gain.exponentialRampToValueAtTime(.0001, audioCtx.currentTime + .05);
               o.connect(g);
               g.connect(audioCtx.destination);
               o.start();
               o.stop(audioCtx.currentTime + .05);
          } catch (e) {}
     }

     function fanfare() {
          if (!$('sound').checked) return;
          try {
               [523, 659, 784, 1047].forEach(function (f, i) {
                    var o = audioCtx.createOscillator(),
                         g = audioCtx.createGain(),
                         t = audioCtx.currentTime + i * .11;
                    o.type = 'sine';
                    o.frequency.value = f;
                    g.gain.setValueAtTime(.08, t);
                    g.gain.exponentialRampToValueAtTime(.0001, t + .4);
                    o.connect(g);
                    g.connect(audioCtx.destination);
                    o.start(t);
                    o.stop(t + .4);
               });
          } catch (e) {}
     }

     function spin() {
          if (spinning || names.length < 2) return;
          spinning = true;
          $('spin').disabled = true;
          var n = names.length,
               s = TAU / n,
               w = Math.floor(Math.random() * n);
          var target = 3 * Math.PI / 2 - (w + .12 + .76 * Math.random()) * s;
          var delta = ((target - rotation) % TAU + TAU) % TAU + TAU * (5 + Math.floor(Math.random() * 3));
          var start = rotation,
               dur = 5200 + Math.random() * 1200,
               t0 = performance.now(),
               lastIdx = indexAt(rotation);

          function frame(t) {
               var p = Math.min(1, (t - t0) / dur),
                    e = 1 - Math.pow(1 - p, 4);
               rotation = start + delta * e;
               var idx = indexAt(rotation);
               if (idx !== lastIdx) {
                    tick();
                    lastIdx = idx
               }
               draw();
               if (p < 1) requestAnimationFrame(frame);
               else finish(w);
          }
          requestAnimationFrame(frame);
     }

     function finish(w) {
          spinning = false;
          lastWinner = w;
          var name = names[w];
          history.unshift({
               name: name,
               time: new Date().toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
               })
          });
          history = history.slice(0, 50);
          renderHistory();
          $('winnerName').textContent = name;
          $('overlay').classList.add('show');
          $('close').focus();
          fanfare();
          confetti();
          $('spin').disabled = names.length < 2;
          save();
     }

     function removeWinner() {
          if (lastWinner === null) return;
          names.splice(lastWinner, 1);
          lastWinner = null;
          $('names').value = names.join('\n');
          parse();
     }

     function closeModal() {
          $('overlay').classList.remove('show');
          if ($('removeWinner').checked) removeWinner();
     }

     function renderHistory() {
          var ol = $('history');
          ol.innerHTML = '';
          history.forEach(function (h) {
               var li = document.createElement('li'),
                    a = document.createElement('strong'),
                    b = document.createElement('span');
               a.textContent = h.name;
               b.textContent = h.time;
               li.appendChild(a);
               li.appendChild(b);
               ol.appendChild(li);
          });
          $('histEmpty').style.display = history.length ? 'none' : 'block';
     }

     function confetti() {
          if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
          var cv = $('confetti'),
               cx = cv.getContext('2d');
          cv.width = innerWidth;
          cv.height = innerHeight;
          var cols = ['#d4b06a', '#f0d9a0', '#8f2d3a', '#1f6f6b', '#ece7dc', '#3b4a8f'];
          var ps = [];
          for (var i = 0; i < 140; i++) ps.push({
               x: innerWidth / 2,
               y: innerHeight * .45,
               vx: (Math.random() - .5) * 16,
               vy: -Math.random() * 15 - 3,
               r: Math.random() * 6 + 3,
               c: cols[i % cols.length],
               rot: Math.random() * 6,
               vr: (Math.random() - .5) * .3
          });
          var f = 0;
          (function step() {
               cx.clearRect(0, 0, cv.width, cv.height);
               ps.forEach(function (p) {
                    p.vy += .4;
                    p.x += p.vx;
                    p.y += p.vy;
                    p.rot += p.vr;
                    p.vx *= .99;
                    cx.save();
                    cx.translate(p.x, p.y);
                    cx.rotate(p.rot);
                    cx.fillStyle = p.c;
                    cx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * .6);
                    cx.restore()
               });
               if (++f < 150) requestAnimationFrame(step);
               else cx.clearRect(0, 0, cv.width, cv.height);
          })();
     }

     $('spin').onclick = spin;
     $('names').addEventListener('input', function () {
          if (!spinning) parse()
     });
     document.querySelectorAll('[data-preset]').forEach(function (b) {
          b.onclick = function () {
               if (spinning) return;
               $('names').value = PRESETS[b.dataset.preset].join('\n');
               parse()
          }
     });
     $('shuffle').onclick = function () {
          if (spinning) return;
          for (var i = names.length - 1; i > 0; i--) {
               var j = Math.floor(Math.random() * (i + 1));
               var t = names[i];
               names[i] = names[j];
               names[j] = t
          }
          $('names').value = names.join('\n');
          parse()
     };
     $('sort').onclick = function () {
          if (spinning) return;
          $('names').value = names.slice().sort(function (a, b) {
               return a.localeCompare(b, 'id')
          }).join('\n');
          parse()
     };
     $('clear').onclick = function () {
          if (spinning) return;
          $('names').value = '';
          parse()
     };
     $('clearHist').onclick = function () {
          history = [];
          renderHistory();
          save()
     };
     $('close').onclick = closeModal;
     $('again').onclick = function () {
          closeModal();
          setTimeout(spin, 150)
     };
     $('removeNow').onclick = function () {
          $('overlay').classList.remove('show');
          removeWinner()
     };
     $('overlay').addEventListener('click', function (e) {
          if (e.target === this) closeModal()
     });
     document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape' && $('overlay').classList.contains('show')) closeModal();
          if (e.key === ' ' && document.activeElement === document.body) {
               e.preventDefault();
               spin()
          }
     });
     window.addEventListener('resize', resize);

     load();
     renderHistory();
     parse();
     resize();
})();