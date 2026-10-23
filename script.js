/* =====================================================
   SCRIPT — O Raso Também Pode Afogar
   JavaScript puro (sem bibliotecas)
   ===================================================== */
(function () {
  'use strict';

  var raiz = document.documentElement;
  var controleMovimentos = document.querySelector('.movimento-toggle');
  var controleTema = document.querySelector('.tema-toggle');
  var ponteiroFino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var observador = null;
  var gotasAgua = [];
  var ultimaGotaX = null;
  var ultimaGotaY = null;
  var movimentosAtivos = true;
  var temaEscuro = false;

  try {
    var preferenciaSalva = window.localStorage.getItem('movimentos-ativos');
    var temaSalvo = window.localStorage.getItem('tema-escuro');
    if (preferenciaSalva === 'true') movimentosAtivos = true;
    if (preferenciaSalva === 'false') movimentosAtivos = false;
    temaEscuro = temaSalvo === 'true';
  } catch (erroArmazenamento) {
    console.warn('Não foi possível carregar as preferências salvas neste navegador.', erroArmazenamento);
  }

  function definirTema(escuro, salvar) {
    temaEscuro = escuro;
    raiz.classList.toggle('tema-escuro', escuro);
    controleTema.setAttribute('aria-pressed', String(escuro));
    controleTema.setAttribute('aria-label', (escuro ? 'Desativar' : 'Ativar') + ' modo escuro');
    controleTema.querySelector('.tema-toggle__texto').textContent = 'Tema';

    if (salvar) {
      try {
        window.localStorage.setItem('tema-escuro', String(escuro));
      } catch (erroArmazenamento) {
        console.warn('Não foi possível salvar a preferência de tema neste navegador.', erroArmazenamento);
      }
    }
  }

  function iniciarRevelacoes() {
    var itens = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) return;
    if (!observador) {
      observador = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (entrada) {
          if (entrada.isIntersecting) {
            entrada.target.classList.add('visivel');
            observador.unobserve(entrada.target);
          }
        });
      }, { threshold: 0.15 });
    }
    raiz.classList.add('js-ativo');
    itens.forEach(function (el, i) {
      if (!el.classList.contains('visivel')) {
        el.style.transitionDelay = (i % 2) * 0.12 + 's';
        observador.observe(el);
      }
    });
  }

  function pararRevelacoes() {
    if (observador) observador.disconnect();
    raiz.classList.remove('js-ativo');
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      el.classList.remove('visivel');
      el.style.removeProperty('transition-delay');
    });
  }

  function criarGotaAgua(x, y) {
    var gota = document.createElement('span');
    var deslocamentoX = Math.round((Math.random() - 0.5) * 28) + 'px';
    var deslocamentoY = Math.round(-8 - Math.random() * 22) + 'px';
    var tamanho = 6 + Math.random() * 6;

    gota.className = 'gota-agua';
    gota.setAttribute('aria-hidden', 'true');
    gota.style.left = x + 'px';
    gota.style.top = y + 'px';
    gota.style.width = tamanho + 'px';
    gota.style.height = tamanho * 1.4 + 'px';
    gota.style.setProperty('--gota-x', deslocamentoX);
    gota.style.setProperty('--gota-y', deslocamentoY);
    document.body.appendChild(gota);
    gotasAgua.push(gota);

    gota.addEventListener('animationend', function () {
      gotasAgua = gotasAgua.filter(function (item) { return item !== gota; });
      gota.remove();
    }, { once: true });

    if (gotasAgua.length > 14) gotasAgua.shift().remove();
  }

  function definirMovimentos(ativo, salvar) {
    movimentosAtivos = ativo;
    raiz.classList.toggle('movimentos-ativos', ativo);
    controleMovimentos.setAttribute('aria-pressed', String(ativo));
    controleMovimentos.setAttribute('aria-label', (ativo ? 'Desativar' : 'Ativar') + ' movimentos');
    controleMovimentos.querySelector('.movimento-toggle__texto').textContent = 'Movimentos';

    if (ativo) {
      iniciarRevelacoes();
    } else {
      gotasAgua.forEach(function (gota) { gota.remove(); });
      gotasAgua = [];
      document.querySelectorAll('.ripple-agua').forEach(function (onda) { onda.remove(); });
      pararRevelacoes();
    }

    if (salvar) {
      try {
        window.localStorage.setItem('movimentos-ativos', String(ativo));
      } catch (erroArmazenamento) {
        console.warn('Não foi possível salvar a preferência de movimento neste navegador.', erroArmazenamento);
      }
    }
  }

  /* ---------- 0. CONTROLE DE MOVIMENTOS E EFEITOS DE ÁGUA ---------- */
  definirTema(temaEscuro, false);
  definirMovimentos(movimentosAtivos, false);
  controleMovimentos.addEventListener('click', function () {
    definirMovimentos(!movimentosAtivos, true);
  });
  controleTema.addEventListener('click', function () {
    definirTema(!temaEscuro, true);
  });

  document.addEventListener('pointermove', function (e) {
    if (!movimentosAtivos || !ponteiroFino || (e.pointerType !== 'mouse' && e.pointerType !== 'pen')) return;

    var distanciaX = ultimaGotaX === null ? Infinity : e.clientX - ultimaGotaX;
    var distanciaY = ultimaGotaY === null ? Infinity : e.clientY - ultimaGotaY;
    if (distanciaX * distanciaX + distanciaY * distanciaY < 18 * 18) return;

    criarGotaAgua(e.clientX, e.clientY);
    ultimaGotaX = e.clientX;
    ultimaGotaY = e.clientY;
  }, { passive: true });

  document.documentElement.addEventListener('pointerleave', function () {
    ultimaGotaX = null;
    ultimaGotaY = null;
  });

  document.addEventListener('pointerdown', function (e) {
    if (!movimentosAtivos) return;
    var onda = document.createElement('span');
    onda.className = 'ripple-agua';
    onda.setAttribute('aria-hidden', 'true');
    onda.style.left = e.clientX + 'px';
    onda.style.top = e.clientY + 'px';
    document.body.appendChild(onda);
    onda.addEventListener('animationend', function () { onda.remove(); }, { once: true });
    window.setTimeout(function () { onda.remove(); }, 1000);
  }, { passive: true });

  /* ---------- 1. NAVBAR: sombra ao rolar + menu mobile ---------- */
  var nav = document.querySelector('.nav');
  var botaoMenu = document.querySelector('.nav__toggle');
  var menu = document.getElementById('menu');

  function aoRolar() {
    nav.classList.toggle('nav--rolou', window.scrollY > 30); // classe estilizada no CSS
  }
  window.addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();

  function alternarMenu(abrir) {
    menu.classList.toggle('aberto', abrir);
    botaoMenu.setAttribute('aria-expanded', String(abrir));
  }
  nav.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link || !nav.contains(link)) return;

    var destino = document.getElementById(link.hash.slice(1));
    if (!destino) return;

    e.preventDefault();
    if (menu.contains(link)) alternarMenu(false);
    if (window.location.hash !== link.hash) window.history.pushState(null, '', link.hash);
    destino.scrollIntoView({
      behavior: movimentosAtivos ? 'smooth' : 'auto',
      block: 'start'
    });
  });
  botaoMenu.addEventListener('click', function () {
    alternarMenu(botaoMenu.getAttribute('aria-expanded') !== 'true');
  });

  /* ---------- 2. REVELAR ELEMENTOS AO ROLAR ----------
     Elementos com data-reveal aparecem quando entram na tela.
     Se o navegador não suportar IntersectionObserver, tudo
     fica visível (a classe .js-ativo só é ligada se suportar). */
  /* ---------- 3. TILT DO LIVRO NO HERO (segue o mouse) ---------- */
  var tilt = document.querySelector('[data-tilt] img');
  if (tilt && ponteiroFino) {
    var area = document.querySelector('.hero');
    area.addEventListener('mousemove', function (e) {
      if (!movimentosAtivos) return;
      var r = area.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;   // -0.5 a 0.5
      var y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = 'rotateY(' + (x * 10) + 'deg) rotateX(' + (-y * 8) + 'deg)'; // ajuste a intensidade aqui
    });
    area.addEventListener('mouseleave', function () { tilt.style.transform = ''; });
  }

  /* ---------- 4. FAIXA / CARTA DA AUTORA (sessão 4) ---------- */
  var overlay = document.getElementById('faixa');
  var botaoAbrir = document.querySelector('[data-abrir-faixa]');
  var botaoFechar = overlay.querySelector('.faixa__fechar');

  function abrirFaixa() {
    overlay.hidden = false;
    document.body.style.overflow = 'hidden'; // trava a rolagem
    // Duas frames para o navegador registrar o estado inicial antes da animação
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.add('aberta');
        botaoFechar.focus();
      });
    });
  }
  function fecharFaixa() {
    overlay.classList.remove('aberta');
    document.body.style.overflow = '';
    setTimeout(function () { overlay.hidden = true; }, 700); // espera a animação de saída
    botaoAbrir.focus(); // devolve o foco ao botão
  }

  botaoAbrir.addEventListener('click', abrirFaixa);
  overlay.addEventListener('click', function (e) {
    if (e.target.closest('[data-fechar-faixa]')) fecharFaixa();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !overlay.hidden) fecharFaixa();
    // Mantém o foco dentro da carta enquanto aberta (só há um botão focável)
    if (e.key === 'Tab' && !overlay.hidden) { e.preventDefault(); botaoFechar.focus(); }
  });

  /* ---------- 5. IMAGENS AUSENTES: mostra quadro tracejado em vez de ícone quebrado ---------- */
  document.querySelectorAll('img').forEach(function (img) {
    function marcar() { img.classList.add('sem-imagem'); }
    img.addEventListener('error', marcar);
    if (img.complete && img.naturalWidth === 0) marcar(); // já falhou antes do script rodar
  });
})();
