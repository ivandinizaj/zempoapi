import { parseLocalidades } from "../localidadesParser";

describe("parseLocalidades", () => {
  it("lê as opções de retorno_cidades/retorno_bairros", () => {
    const html = `<select name="cidade"><option value="" ></option>
      <option value='5135'>Abreu e Lima</option><option value='5406'>Recife</option></select>`;
    expect(parseLocalidades(html).itens).toEqual([
      { id: "5135", nome: "Abreu e Lima" },
      { id: "5406", nome: "Recife" },
    ]);
  });
});
