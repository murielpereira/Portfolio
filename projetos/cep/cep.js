/* Mascara de CEP */

const handleZipCode = (event) => {
    let input = event.target
    input.value = zipCodeMask(input.value)
    if (event.key === 'Enter') {
      consultaEndereco()
    }
  }
  
  const zipCodeMask = (value) => {
    if (!value) return ""
    value = value.replace(/\D/g,'')
    value = value.replace(/(\d{5})(\d)/,'$1-$2')
    return value
  }

  /* Consultar Endereço */

  function consultaEndereco() {
    let cepInput = document.querySelector('#cep');
    let btnPesquisar = document.querySelector('#btn_pesquisar');
    let cep = cepInput.value;

    if (cep.length !== 9) {
      alert('CEP Inválido!');
      return;
    }

    // Set loading state
    if (btnPesquisar) {
      btnPesquisar.disabled = true;
      btnPesquisar.innerText = 'Pesquisando...';
    }
    cepInput.disabled = true;

    let url = `https://viacep.com.br/ws/${cep}/json/`;

    fetch(url)
      .then(function(response){
        response.json().then(mostrarEndereco);
      })
      .catch(function(error) {
        let resultado = document.querySelector('#resultado');
        resultado.innerHTML = "Erro ao conectar com o serviço de CEP.";
        resetLoadingState();
      });
  }

  function resetLoadingState() {
    let cepInput = document.querySelector('#cep');
    let btnPesquisar = document.querySelector('#btn_pesquisar');
    if (btnPesquisar) {
      btnPesquisar.disabled = false;
      btnPesquisar.innerText = 'Pesquisar';
    }
    if (cepInput) {
      cepInput.disabled = false;
      // Refocus input to continue typing if needed
      cepInput.focus();
    }
  }

  function mostrarEndereco(dados){
    resetLoadingState();
    let resultado = document.querySelector('#resultado');
    if (dados.erro){
      resultado.innerHTML = "Não foi possivel localizar endereço. Verifique novamente o CEP digitado.";
    } 
    
    else{
      resultado.innerHTML = `<p>CEP: ${dados.cep}</p>
                           <p>Endereço: ${dados.logradouro}</p>
                           <p>Complemento: ${dados.complemento}</p>
                           <p>Bairro: ${dados.bairro}</p>
                           <p>Cidade: ${dados.localidade} - ${dados.uf}</p>`
    }
  }