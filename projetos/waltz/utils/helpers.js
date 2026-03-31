const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function fetchComRetry(url, options, tentativas = 3) {
    for (let i = 0; i < tentativas; i++) {
        try {
            const res = await fetch(url, options);
            if (res.ok) return res;
        } catch (e) {}
        if (i < tentativas - 1) await delay(2000); 
    }
    throw new Error("Falha no fetch após 3 tentativas.");
}

module.exports = { delay, fetchComRetry };