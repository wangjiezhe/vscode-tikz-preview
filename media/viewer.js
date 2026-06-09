(function () {
    pdfjsLib.GlobalWorkerOptions.workerSrc = globalThis.WORKER_SRC_PLACEHOLDER;

    var pdfDoc = null;
    var currentPage = 1;
    var currentScale = 1;
    var fitWidth = true;

    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    var viewportEl = document.getElementById('viewport');
    var errorDiv = document.getElementById('error');
    var zoomLevel = document.getElementById('zoomLevel');
    var pageInfo = document.getElementById('pageInfo');
    var prevBtn = document.getElementById('prevPage');
    var nextBtn = document.getElementById('nextPage');

    function renderPage(num) {
        if (!pdfDoc) {return;}
        pdfDoc.getPage(num).then(function (page) {
            var pixelRatio = window.devicePixelRatio || 1;
            var vp = page.getViewport({ scale: currentScale * pixelRatio });
            canvas.width = vp.width;
            canvas.height = vp.height;
            canvas.style.width = (vp.width / pixelRatio) + 'px';
            canvas.style.height = (vp.height / pixelRatio) + 'px';
            return page.render({ canvasContext: ctx, viewport: vp }).promise;
        }).then(function () {
            currentPage = num;
            updateUI();
        });
    }

    function updateUI() {
        if (!pdfDoc) {return;}
        zoomLevel.value = Math.round(currentScale * 100) + '%';
        pageInfo.textContent = 'Page ' + currentPage + ' / ' + pdfDoc.numPages;
        prevBtn.classList.toggle('hidden', pdfDoc.numPages <= 1);
        nextBtn.classList.toggle('hidden', pdfDoc.numPages <= 1);
    }

    function applyZoomInput() {
        var val = zoomLevel.value.replace('%', '').trim();
        var num = parseFloat(val);
        if (!isNaN(num) && num > 0) {
            fitWidth = false;
            currentScale = Math.min(5, Math.max(0.1, num / 100));
            renderPage(currentPage);
        } else {
            zoomLevel.value = Math.round(currentScale * 100) + '%';
        }
    }

    zoomLevel.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            zoomLevel.blur();
        }
    });

    zoomLevel.addEventListener('blur', function () {
        applyZoomInput();
    });

    function fitToWidth() {
        if (!pdfDoc) {return;}
        pdfDoc.getPage(currentPage).then(function (page) {
            var vp = page.getViewport({ scale: 1 });
            currentScale = (viewportEl.clientWidth / vp.width) * 0.9;
            renderPage(currentPage);
        });
    }

    document.getElementById('zoomIn').addEventListener('click', function () {
        fitWidth = false;
        currentScale = Math.min(5, currentScale * 1.25);
        renderPage(currentPage);
    });

    document.getElementById('zoomOut').addEventListener('click', function () {
        fitWidth = false;
        currentScale = Math.max(0.1, currentScale / 1.25);
        renderPage(currentPage);
    });

    document.getElementById('fitWidth').addEventListener('click', function () {
        fitWidth = true;
        fitToWidth();
    });

    prevBtn.addEventListener('click', function () {
        if (currentPage > 1) {renderPage(currentPage - 1);}
    });

    nextBtn.addEventListener('click', function () {
        if (pdfDoc && currentPage < pdfDoc.numPages) {renderPage(currentPage + 1);}
    });

    window.addEventListener('message', function (event) {
        var msg = event.data;
        if (msg.type === 'render') {
            errorDiv.classList.add('hidden');
            viewportEl.classList.remove('hidden');
            pdfjsLib.getDocument({ url: msg.pdfPath, disableWorker: true }).promise.then(function (pdf) {
                pdfDoc = pdf;
                if (fitWidth) {
                    fitToWidth();
                } else {
                    renderPage(1);
                }
            }).catch(function (err) {
                errorDiv.textContent = 'Failed to load PDF: ' + err.message;
                errorDiv.classList.remove('hidden');
                viewportEl.classList.add('hidden');
            });
        } else if (msg.type === 'error') {
            viewportEl.classList.add('hidden');
            errorDiv.textContent = msg.message;
            errorDiv.classList.remove('hidden');
        }
    });

    window.addEventListener('resize', function () {
        if (fitWidth) {fitToWidth();}
    });
})();
