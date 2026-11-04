// Estrutura reduzida do formulário real de ?secao=pessoas_editar (dados fictícios)
export const ATHLETE_EDIT_PAGE = `
<html><head><title>ZEMPO - CBJ</title><script>var menu = "<form id='outro'></form>";</script></head>
<body>
<div id="esconde"><div class="aviso3 centraliza">Atleta atualizado com sucesso!</div>
<form id="formulario" name="formulario" method="post"
  action="?secao=pessoas_editar&amp;acao=atualizar&amp;id=12345#basicos" enctype="multipart/form-data">
  <input type="hidden" id="graduacao_antes" name="graduacao_antes" value="12" />
  <input type="hidden" id="graduacao_data_antes" name="graduacao_antes" value="2025-12-13" />
  <input type="hidden" id="sexo" name="sexo" value="1" />
  <table>
    <tr><td>Primeiro Nome</td><td>Maria</td><td><input type="file" name="foto" id="foto" /></td></tr>
    <tr><td>Nome Completo</td><td> Maria   José Souza </td></tr>
    <tr><td>Inglês</td><td><select name="ingles" id="ingles" class="formulario validate[required]">
      <option value="0">---------</option><option value="1">Sem Conhecimento</option></select></td></tr>
    <tr><td>Peso</td><td><input type="text" name="peso" id="peso" value="73.00" class="formulario validate[required]" />
      <input type="hidden" id="categoria" name="categoria" value="5" /></td></tr>
    <tr><td>Email</td><td><input type="text" name="email" id="email" value="maria@example.com"
      class="formulario validate[required,custom[email]]" /></td></tr>
    <tr><td>Celular</td><td><input type="text" name="celular" id="celular" value="(81)99999-0000"
      class="formulario Telefone validate[required]" /></td></tr>
    <tr><td>RG</td><td>
      <select name="rg_estado" id="rg_estado" class="formulario validate[required]">
        <option value="17" selected="selected">PE</option><option value="0">---------</option></select>
      <input type="text" name="rg_data" id="rg_data" value="01/02/2010" class="formulario Data2 validate[required]" /></td></tr>
    <tr><td>Passaporte</td><td><input type="text" name="passaporte" id="passaporte" value="" class="formulario" /></td></tr>
    <tr><td>Endereço</td><td><input type="text" name="endereco" id="endereco" value="Rua A, 45" class="formulario validate[required]" />
      <input type="text" name="complemento" id="complemento" value="" class="formulario" /></td></tr>
    <tr><td>Estado</td><td><select name="estado" id="estado" class="formulario validate[required]">
      <option value="">---</option><option value="17" selected="selected">PE</option><option value="25">SP</option></select></td></tr>
    <tr><td>Cidade</td><td><select name="cidade" id="cidade" class="formulario validate[required]">
      <option value="">---------</option><option value="5406" selected>Recife</option></select></td></tr>
    <tr><td>Bairro</td><td><select name="bairro" id="bairro" class="formulario validate[required]">
      <option value="7361" selected>Madalena</option></select></td></tr>
    <tr><td>Senha</td><td><input type="password" name="senha" id="senha" value="" /></td></tr>
    <tr><td>Bloqueado</td><td><input type="text" name="bloqueado" value="x" disabled /></td></tr>
    <tr><td>Mãe</td><td><input type="text" name="mae" id="mae" value="Conceição" class="formulario" /></td></tr>
  </table>
  <input type="image" name="imageField" src="imagens/salvar.gif" />
</form>
</div>
</body></html>`;
