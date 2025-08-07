import 'dart:convert';
import 'package:http/http.dart' as http;

// Modelo para representar un producto
class Producto {
  final int? id;
  final String? nombre;
  final String? descripcion;
  final double? precio;
  final String? categoria;
  final String? imagen;
  final String? imagenUrl;
  final int? stock;
  final DateTime? fechaCreacion;

  Producto({
    this.id,
    this.nombre,
    this.descripcion,
    this.precio,
    this.categoria,
    this.imagen,
    this.imagenUrl,
    this.stock,
    this.fechaCreacion,
  });

  factory Producto.fromJson(Map<String, dynamic> json) {
    return Producto(
      id: json['id'] != null ? int.tryParse(json['id'].toString()) : null,
      nombre: json['nombre']?.toString(),
      descripcion: json['descripcion']?.toString(),
      precio: json['precio'] != null ? double.tryParse(json['precio'].toString()) : null,
      categoria: json['categoria']?.toString(),
      imagen: json['imagen']?.toString(),
      imagenUrl: json['imagen_url']?.toString(),
      stock: json['stock'] != null ? int.tryParse(json['stock'].toString()) : null,
      fechaCreacion: json['fecha_creacion'] != null 
          ? DateTime.tryParse(json['fecha_creacion'].toString()) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nombre': nombre,
      'descripcion': descripcion,
      'precio': precio,
      'categoria': categoria,
      'imagen': imagen,
      'imagen_url': imagenUrl,
      'stock': stock,
      'fecha_creacion': fechaCreacion?.toIso8601String(),
    };
  }
}

// Respuesta de la API
class ApiResponse {
  final bool success;
  final List<Producto>? data;
  final int? total;
  final String? error;

  ApiResponse({
    required this.success,
    this.data,
    this.total,
    this.error,
  });

  factory ApiResponse.fromJson(Map<String, dynamic> json) {
    return ApiResponse(
      success: json['success'] ?? false,
      data: json['data'] != null 
          ? (json['data'] as List).map((item) => Producto.fromJson(item)).toList()
          : null,
      total: json['total'] != null ? int.tryParse(json['total'].toString()) : null,
      error: json['error']?.toString(),
    );
  }
}
// Servicio para consumir la API de productos
class ProductosApiService {
  static const String baseUrl = 'https://exploreshop.store'; // Cambia por tu URL base
  static const String apiEndpoint = '/api_productos.php';
  
  // Método para obtener todos los productos
  static Future<ApiResponse> obtenerProductos() async {
    try {
      final url = Uri.parse('$baseUrl$apiEndpoint');
      
      print('Realizando petición a: $url');
      
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ).timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          throw Exception('Timeout: La petición tardó demasiado');
        },
      );

      print('Código de respuesta: ${response.statusCode}');
      print('Cuerpo de respuesta: ${response.body}');

      if (response.statusCode == 200) {
        final Map<String, dynamic> jsonData = json.decode(response.body);
        return ApiResponse.fromJson(jsonData);
      } else {
        return ApiResponse(
          success: false,
          error: 'Error HTTP ${response.statusCode}: ${response.reasonPhrase}',
        );
      }
    } catch (e) {
      print('Error en la petición: $e');
      return ApiResponse(
        success: false,
        error: 'Error de conexión: ${e.toString()}',
      );
    }
  }

  // Método para obtener productos por categoría (si necesitas filtrar)
  static Future<ApiResponse> obtenerProductosPorCategoria(String categoria) async {
    try {
      final productos = await obtenerProductos();
      
      if (productos.success && productos.data != null) {
        final productosFiltrados = productos.data!
            .where((producto) => 
                producto.categoria?.toLowerCase() == categoria.toLowerCase())
            .toList();
        
        return ApiResponse(
          success: true,
          data: productosFiltrados,
          total: productosFiltrados.length,
        );
      }
      
      return productos;
    } catch (e) {
      return ApiResponse(
        success: false,
        error: 'Error al filtrar productos: ${e.toString()}',
      );
    }
  }

  // Método para buscar productos por nombre
  static Future<ApiResponse> buscarProductos(String termino) async {
    try {
      final productos = await obtenerProductos();
      
      if (productos.success && productos.data != null) {
        final productosFiltrados = productos.data!
            .where((producto) => 
                producto.nombre?.toLowerCase().contains(termino.toLowerCase()) == true ||
                producto.descripcion?.toLowerCase().contains(termino.toLowerCase()) == true)
            .toList();
        
        return ApiResponse(
          success: true,
          data: productosFiltrados,
          total: productosFiltrados.length,
        );
      }
      
      return productos;
    } catch (e) {
      return ApiResponse(
        success: false,
        error: 'Error al buscar productos: ${e.toString()}',
      );
    }
  }
}
// Ejemplo de uso del servicio


// Función main para probar el servicio
void main() async {
  // Ejemplo de uso
  await EjemploUso.ejemploObtenerProductos();

}