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

    let btn = document.querySelector('.pesquisa');

    // Prevent double submission if already loading
    if (btn.disabled) return;

    let originalText = btn.innerHTML;
    btn.innerHTML = 'Carregando...';
    btn.disabled = true;

    fetch(url).then(function(response){
      return response.json();
    }).then(function(dados) {
      mostrarEndereco(dados);
      btn.innerHTML = originalText;
      btn.disabled = false;
    }).catch(function(error) {
      console.error(error);
      // Handle parsing or network errors gracefully, ensuring UI resets
      let resultado = document.querySelector('#resultado');
      resultado.innerHTML = "Não foi possivel localizar endereço. Verifique novamente o CEP digitado.";
      btn.innerHTML = originalText;
      btn.disabled = false;
    });
  }

  // Add event listener for Enter key support
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      let cepInput = document.querySelector('#cep');
      if (cepInput) {
        cepInput.addEventListener('keypress', function (e) {
          if (e.key === 'Enter') {
            consultaEndereco();
          }
        });
      }
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