import java.io.*;
import java.net.*;
import java.nio.file.*;
import java.sql.*;
import java.util.*;

public class ServidorJava {

    private static final int PORTA = 8080;
    private static final String PASTA_SITE = "site";

    // >>> CONFIGURAÇÃO DO BANCO <<<
    // Ajuste DB_USER e DB_PASS para o seu MySQL
    private static final String DB_URL  = "jdbc:mysql://localhost:3306/tanamesa?useSSL=false&serverTimezone=UTC";
    private static final String DB_USER = "root";
    private static final String DB_PASS = "Senha2018"; //

    public static void main(String[] args) throws IOException {

        // tenta carregar o driver JDBC do MySQL
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            System.out.println("Driver JDBC MySQL carregado.");
        } catch (ClassNotFoundException e) {
            System.err.println("Não foi possível carregar o driver JDBC do MySQL. Verifique o mysql-connector-j no classpath.");
            e.printStackTrace();
        }

        ServerSocket servidor = new ServerSocket(PORTA);
        System.out.println("Servidor rodando em: http://localhost:" + PORTA);

        while (true) {
            Socket cliente = servidor.accept();
            new Thread(() -> {
                try {
                    tratarRequisicao(cliente);
                } catch (Exception e) {
                    e.printStackTrace();
                    try { cliente.close(); } catch (IOException ex) {}
                }
            }).start();
        }
    }

    private static void tratarRequisicao(Socket cliente) throws IOException {
        BufferedReader entrada = new BufferedReader(new InputStreamReader(cliente.getInputStream()));
        OutputStream saida = cliente.getOutputStream();

        String linha = entrada.readLine();
        if (linha == null || linha.isEmpty()) {
            cliente.close();
            return;
        }

        String[] partes = linha.split(" ");
        if (partes.length < 2) {
            cliente.close();
            return;
        }

        String metodo = partes[0];
        String caminho = partes[1];

        try {
            caminho = URLDecoder.decode(caminho, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            // ignora
        }

        // separa path e query string
        String path = caminho;
        String query = null;
        int qIdx = caminho.indexOf('?');
        if (qIdx >= 0) {
            path = caminho.substring(0, qIdx);
            if (qIdx + 1 < caminho.length()) {
                query = caminho.substring(qIdx + 1);
            }
        }

        // consome o resto dos headers, que não vamos usar aqui
        while ((linha = entrada.readLine()) != null && !linha.isEmpty()) {
            // só descarta
        }

        // endpoint para salvar pedido no banco
        if ("/finalizar".equals(path)) {
            if (!"GET".equalsIgnoreCase(metodo)) {
                sendPlain(saida, "405 Method Not Allowed", "Método não suportado");
            } else {
                tratarFinalizarPedido(query, saida);
            }
            cliente.close();
            return;
        }

        // mapeamento de páginas estáticas
        if ("/".equals(path)) {
            path = "/index.html";
        } else if ("/pagamento".equals(path)) {
            path = "/pagamentoTESTE.html";
        }

        File arquivo = new File(PASTA_SITE + path);

        if (!arquivo.exists() || arquivo.isDirectory()) {
            String resposta404 = "HTTP/1.1 404 Not Found\r\n\r\nPágina não encontrada";
            saida.write(resposta404.getBytes("UTF-8"));
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

        saida.write(header.getBytes("UTF-8"));
        saida.write(conteudo);

        saida.flush();
        cliente.close();
    }

    // ---- helpers para /finalizar ----

    private static Map<String, String> parseQuery(String query) throws UnsupportedEncodingException {
        Map<String, String> params = new HashMap<>();
        if (query == null || query.isEmpty()) return params;

        String[] pairs = query.split("&");
        for (String pair : pairs) {
            int idx = pair.indexOf('=');
            if (idx > 0) {
                String key = URLDecoder.decode(pair.substring(0, idx), "UTF-8");
                String value = URLDecoder.decode(pair.substring(idx + 1), "UTF-8");
                params.put(key, value);
            }
        }
        return params;
    }

    private static void tratarFinalizarPedido(String query, OutputStream saida) throws IOException {
        try {
            Map<String, String> params = parseQuery(query);

            String mesaStr  = params.get("mesa");
            String cliente  = params.get("cliente");
            String telefone = params.get("telefone");
            String totalStr = params.get("total");
            String itens    = params.get("itens");

            if (mesaStr == null || mesaStr.isEmpty() ||
                cliente == null || cliente.isEmpty() ||
                totalStr == null || totalStr.isEmpty() ||
                itens == null || itens.isEmpty()) {

                sendPlain(saida, "400 Bad Request", "Parâmetros insuficientes");
                return;
            }

            int mesa = Integer.parseInt(mesaStr);
            double total = Double.parseDouble(totalStr.replace(",", "."));

            salvarPedidoNoBanco(mesa, cliente, telefone, total, itens);

            sendPlain(saida, "200 OK", "OK");
        } catch (Exception e) {
            e.printStackTrace();
            sendPlain(saida, "500 Internal Server Error", "ERRO AO SALVAR");
        }
    }

    private static void sendPlain(OutputStream saida, String status, String body) throws IOException {
        byte[] bodyBytes = body.getBytes("UTF-8");
        String header =
                "HTTP/1.1 " + status + "\r\n" +
                "Content-Type: text/plain; charset=UTF-8\r\n" +
                "Content-Length: " + bodyBytes.length + "\r\n" +
                "Connection: close\r\n\r\n";
        saida.write(header.getBytes("UTF-8"));
        saida.write(bodyBytes);
    }

    private static void salvarPedidoNoBanco(int mesa, String cliente, String telefone,
                                            double total, String itensJson) throws Exception {
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS)) {
            String sql = "INSERT INTO pedidos (mesa, cliente, telefone, total, itens) VALUES (?, ?, ?, ?, ?)";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setInt(1, mesa);
                ps.setString(2, cliente);
                ps.setString(3, telefone);
                ps.setDouble(4, total);
                ps.setString(5, itensJson);
                ps.executeUpdate();
            }
        }
    }
}
