import java.io.*;
import java.net.*;
import java.nio.file.*;

public class ServidorJava {

    private static final int PORTA = 8080;
    private static final String PASTA_SITE = "site";

    public static void main(String[] args) throws IOException {

        ServerSocket servidor = new ServerSocket(PORTA);
        System.out.println("Servidor rodando em: http://localhost:" + PORTA);

        while (true) {

            Socket cliente = servidor.accept();

            new Thread(() -> {
                try {
                    tratarRequisicao(cliente);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }).start();

        }
    }

    private static void tratarRequisicao(Socket cliente) throws IOException {

        BufferedReader entrada = new BufferedReader(
                new InputStreamReader(cliente.getInputStream()));

        OutputStream saida = cliente.getOutputStream();

        String linha = entrada.readLine();

        if (linha == null || linha.isEmpty()) {
            cliente.close();
            return;
        }

        System.out.println("Requisição: " + linha);

        String[] partes = linha.split(" ");
        String caminho = partes[1];
        caminho = URLDecoder.decode(caminho, "UTF-8");

        if (caminho.equals("/")) {
            caminho = "/index.html";
        }

        if (caminho.equals("/pagamento")) {
            caminho = "/pagamentoTESTE.html";
        }

        File arquivo = new File(PASTA_SITE + caminho);

        if (!arquivo.exists() || arquivo.isDirectory()) {
            String resposta404 = "HTTP/1.1 404 Not Found\r\n\r\nPágina não encontrada";
            saida.write(resposta404.getBytes());
            cliente.close();
            return;
        }

        String tipo = Files.probeContentType(arquivo.toPath());
        if (tipo == null) tipo = "application/octet-stream";

        byte[] conteudo = Files.readAllBytes(arquivo.toPath());

        String header =
                "HTTP/1.1 200 OK\r\n" +
                "Content-Type: " + tipo + "\r\n" +
                "Content-Length: " + conteudo.length + "\r\n" +
                "Connection: close\r\n\r\n";

        saida.write(header.getBytes());
        saida.write(conteudo);

        saida.flush();
        cliente.close();
    }
}
