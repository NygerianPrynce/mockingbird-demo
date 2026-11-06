// Mockingbird deck motion: count-up numbers and the self-drawing timeline.
// Everything degrades to the final, correct values in the HTML if this script or animation is unavailable.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var timers = []
  var ease = function (t) { return 1 - Math.pow(1 - t, 3) }

  function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id) }
  function cancelAll() { timers.forEach(clearTimeout); timers = [] }

  function run(duration, step, done) {
    var start = null
    function frame(ts) {
      if (start === null) start = ts
      var t = Math.min(1, (ts - start) / duration)
      step(ease(t))
      if (t < 1) { var id = requestAnimationFrame(frame); timers.push(id) } else if (done) done()
    }
    var id = requestAnimationFrame(frame); timers.push(id)
  }

  function format(el, v) {
    var dec = Number(el.dataset.decimals || 0)
    var s = dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US')
    return s + (el.dataset.suffix || '')
  }

  function countUp(el) {
    var to = Number(el.dataset.count)
    var final = format(el, to)
    el.textContent = format(el, 0)
    later(function () {
      run(1400, function (p) { el.textContent = format(el, to * p) }, function () { el.textContent = final })
    }, Number(el.dataset.delay || 600))
  }

  function drawTimeline(root) {
    var line = root.querySelector('#tl-line'), brace = root.querySelector('#tl-brace')
    var count = root.querySelector('#tl-count'), d88 = root.querySelector('#tl-d88')
    if (!line || !brace || !count || !d88) return
    var X0 = 40, X1 = 1029, DAYS = 88
    function set(p) {
      var x = X0 + (X1 - X0) * p
      line.setAttribute('x2', x)
      brace.setAttribute('d', 'M' + X0 + ' 92 L' + X0 + ' 72 L' + x + ' 72 L' + x + ' 92')
      count.setAttribute('x', (X0 + x) / 2)
      count.textContent = 'about ' + Math.round(DAYS * p) + ' days'
    }
    d88.classList.remove('on')
    set(0)
    later(function () {
      run(2300, set, function () { set(1); d88.classList.add('on') })
    }, 650)
  }

  function showFinal(root) {
    root.querySelectorAll('[data-count]').forEach(function (el) { el.textContent = format(el, Number(el.dataset.count)) })
    var d88 = root.querySelector('#tl-d88'); if (d88) d88.classList.add('on')
  }

  function onSlide(slide) {
    cancelAll()
    if (!slide) return
    if (reduce || (window.Reveal && Reveal.isPrintingPdf && Reveal.isPrintingPdf())) { showFinal(slide); return }
    slide.querySelectorAll('[data-count]').forEach(countUp)
    drawTimeline(slide)
  }

  // Tell the CSS which way we are travelling, and how the slide we leave should move, so zoom and swipe transitions feel like one motion.
  function direction(e) {
    if (!e.previousSlide || !e.currentSlide) return
    var ph = Reveal.getIndices(e.previousSlide).h, ch = Reveal.getIndices(e.currentSlide).h
    var fwd = ch > ph
    document.documentElement.setAttribute('data-dir', fwd ? 'fwd' : 'back')
    document.querySelectorAll('.slides > section[data-leave]').forEach(function (s) { s.removeAttribute('data-leave') })
    if (fwd && e.currentSlide.dataset.enter) e.previousSlide.setAttribute('data-leave', e.currentSlide.dataset.enter)
  }

  function init() {
    if (!window.Reveal) return
    if (Reveal.isPrintingPdf && Reveal.isPrintingPdf()) { showFinal(document); return }
    Reveal.on('ready', function (e) { onSlide(e.currentSlide) })
    Reveal.on('slidechanged', function (e) { direction(e); onSlide(e.currentSlide) })
    if (Reveal.isReady && Reveal.isReady()) onSlide(Reveal.getCurrentSlide())
  }
  init()
})()
