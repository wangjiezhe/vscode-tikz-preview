(function () {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';

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
        if (!pdfDoc) return;
        pdfDoc.getPage(num).then(function (page) {
            var vp = page.getViewport({ scale: currentScale });
            canvas.width = vp.width;
            canvas.height = vp.height;
            return page.render({ canvasContext: ctx, viewport: vp }).promise;
        }).then(function () {
            currentPage = num;
            updateUI();
        });
    }

    function updateUI() {
        if (!pdfDoc) return;
        zoomLevel.textContent = Math.round(currentScale * 100) + '%';
        pageInfo.textContent = 'Page ' + currentPage + ' / ' + pdfDoc.numPages;
        prevBtn.classList.toggle('hidden', pdfDoc.numPages <= 1);
        nextBtn.classList.toggle('hidden', pdfDoc.numPages <= 1);
    }

    function fitToWidth() {
        if (!pdfDoc) return;
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
        if (currentPage > 1) renderPage(currentPage - 1);
    });

    nextBtn.addEventListener('click', function () {
        if (pdfDoc && currentPage < pdfDoc.numPages) renderPage(currentPage + 1);
    });

    window.addEventListener('message', function (event) {
        var msg = event.data;
        if (msg.type === 'render') {
            errorDiv.classList.add('hidden');
            viewportEl.classList.remove('hidden');
            pdfjsLib.getDocument(msg.pdfPath).promise.then(function (pdf) {
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
        if (fitWidth) fitToWidth();
    });
})();
