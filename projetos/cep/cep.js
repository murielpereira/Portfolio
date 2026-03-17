/* Mascara de CEP */

const handleZipCode = (event) => {
    let input = event.target
    input.value = zipCodeMask(input.value)
  }
  
  const zipCodeMask = (value) => {
    if (!value) return ""
    value = value.replace(/\D/g,'')
    value = value.replace(/(\d{5})(\d)/,'$1-$2')
    return value
  }

  /* Consultar Endereço */

  function consultaEndereco() {
    let cep = document.querySelector('#cep').value;

    if (cep.length !== 9) {
      alert('CEP Inválido!');
      return;
    }

    let url = `https://viacep.com.br/ws/${cep}/json/`;

    fetch(url).then(function(response){
      response.json().then(mostrarEndereco);       
    });
  }

  function mostrarEndereco(dados){
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