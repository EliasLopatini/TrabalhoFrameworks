let stompClient = null;
let connected = false;
let stocksLoaded = false; // Flag para verificar se os stocks foram carregados


// Função para conectar ao WebSocket
function connect() {
    const socket = new SockJS('http://localhost:8080/stock-prices', {
        headers: {
            'ngrok-skip-browser-warning': 'true'
        }
    });
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function (frame) {
        console.log('Connected: ' + frame);

        stompClient.send("/app/connect", {}, JSON.stringify({ name: 'user' }));
        
        // Assina o tópico para receber as atualizações das ações
        stompClient.subscribe('/topic/stock-prices', function(response) {
            const stocks = JSON.parse(response.body);           
            console.log('Received stocks:', stocks);
            if (!stocksLoaded) {
                // Cria os blocos de ações quando os dados são recebidos pela primeira vez
                createStockBlocks(stocks);
                stocksLoaded = true;
            } else {
                // Atualiza os blocos de ações com novos dados
                updateStockBlocks(stocks);
            }
        });
    }, function (error) {
        console.log('Connection lost, retrying in 5 seconds...', error);
        connected = false;
        setTimeout(reconnect, 5000); // Tenta reconectar após 5 segundos
    });
}

// Função para reconectar ao WebSocket
function reconnect() {
    if (!connected) {
        console.log('Reconnecting...');
        connect();
    }
}

// Função para gerar blocos de ações na tela
function createStockBlocks(stocks) {
    const container = document.getElementById('stock-container');
    container.innerHTML = ''; // Limpa o container antes de adicionar novos blocos

    stocks.forEach(stock => {
        const stockBlock = document.createElement('div');
        stockBlock.className = 'stock-block';
        stockBlock.id = stock.name.replace(/\s+/g, '-').toLowerCase(); // Normaliza o ID

        const stockName = document.createElement('h2');
        stockName.innerText = stock.name;

        const stockPrice = document.createElement('p');
        stockPrice.innerText = stock.price.toFixed(2);

        const arrow = document.createElement('span');
        arrow.className = 'arrow';
        arrow.innerText = '→'; // Seta padrão, pode ser mudada

        stockBlock.appendChild(stockName);
        stockBlock.appendChild(stockPrice);
        stockBlock.appendChild(arrow); // Adiciona a seta ao bloco

        container.appendChild(stockBlock);
    });
}

// Função para atualizar os blocos de ações na tela
function updateStockBlocks(stocks) {
    const container = document.getElementById('stock-container');
    let highestPrice = 0;
    let highestStockName = "";
    let lowestPrice = Infinity;
    let lowestStockName = "";

    stocks.forEach(stock => {
        const stockId = stock.name.replace(/\s+/g, '-').toLowerCase();
        const stockBlock = document.getElementById(stockId);

        if (stockBlock) {
            const stockPriceElement = stockBlock.querySelector('p');
            const arrowElement = stockBlock.querySelector('.arrow');
            const previousPrice = parseFloat(stockPriceElement.innerText);
            const currentPrice = stock.price;

            stockPriceElement.innerText = currentPrice.toFixed(2);
            console.log(`Updated ${stock.name} with price: ${currentPrice.toFixed(2)}`);

            // Verifica se o preço aumentou ou diminuiu e atualiza a seta
            if (currentPrice > previousPrice) {
                stockBlock.classList.add('increase');
                stockBlock.classList.remove('decrease');
                arrowElement.innerText = '↑'; // Seta para cima
            } else if (currentPrice < previousPrice) {
                stockBlock.classList.add('decrease');
                stockBlock.classList.remove('increase');
                arrowElement.innerText = '↓'; // Seta para baixo
            } else {
                arrowElement.innerText = '→'; // Seta padrão se não houver mudança
            }
        } else {
            const newBlock = document.createElement('div');
            newBlock.className = 'stock-block';
            newBlock.id = stockId;

            const stockName = document.createElement('h2');
            stockName.innerText = stock.name;

            const stockPrice = document.createElement('p');
            stockPrice.innerText = stock.price.toFixed(2);

            const arrow = document.createElement('span');
            arrow.className = 'arrow';
            arrow.innerText = '→'; // Seta padrão para novos blocos

            newBlock.appendChild(stockName);
            newBlock.appendChild(stockPrice);
            newBlock.appendChild(arrow);

            container.appendChild(newBlock);
            console.log(`Created new stock block for ${stock.name}`);
        }

        if (stock.price > highestPrice) {
            highestPrice = stock.price;
            highestStockName = stock.name;
        }
        if (stock.price < lowestPrice) {
            lowestPrice = stock.price;
            lowestStockName = stock.name;
        }
    });

    const highestPriceElement = document.getElementById('highest-price');
    highestPriceElement.innerText = `${highestStockName}: ${highestPrice.toFixed(2)}`;

    const lowestPriceElement = document.getElementById('lowest-price');
    lowestPriceElement.innerText = `${lowestStockName}: ${lowestPrice.toFixed(2)}`;
}


window.onload = function() {
    connect();
};

