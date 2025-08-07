<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Configuración de la base de datos
$servername = "localhost";
$username = "u882392170_gestion";  // Tu usuario MySQL
$password = "P|a8rF0&";    // Cambia esto por tu contraseña real
$dbname = "u882392170_gestion";

try {
    // Crear conexión
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Consulta para obtener productos
    $stmt = $pdo->prepare("SELECT * FROM productos");
    $stmt->execute();
    
    $productos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // URL base para las imágenes - ajusta según tu estructura
    $base_url_images = "https://exploreshop.store/images/";
    
    // Procesar cada producto para agregar URL completa de imagen
    foreach ($productos as &$producto) {
        if (!empty($producto['imagen'])) {
            // Si la imagen ya tiene http/https, no agregar base URL
            if (strpos($producto['imagen'], 'http') !== 0) {
                $producto['imagen_url'] = $base_url_images . $producto['imagen'];
            } else {
                $producto['imagen_url'] = $producto['imagen'];
            }
        } else {
            $producto['imagen_url'] = null;
        }
    }
    
    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'data' => $productos,
        'total' => count($productos)
    ]);
    
} catch(PDOException $e) {
    // Error en la conexión o consulta
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error de conexión: ' . $e->getMessage()
    ]);
}

$pdo = null;
?>