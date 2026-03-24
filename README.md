# App de Producción de Motos - AppSheets

## Descripción

App móvil para registrar la producción diaria de motos.
El operario escanea el QR del chasis con la cámara del celular y la app
completa automáticamente los datos del modelo.

## Flujo de uso

1. Operario abre la app en el celular
2. Escanea el código QR del **número de chasis**
3. La app auto-completa: **MODELO, CILINDRADA, RUEDA, COD MOD, COD MOTOR**
4. Operario ingresa manualmente: **NUM. MOTOR** y **COLOR**
5. La app valida que no existan duplicados
6. Guarda el registro

## Tabla principal: PRODUCCION

| Columna      | Tipo    | Origen         | Descripción                         |
|-------------|---------|----------------|-------------------------------------|
| FECHA       | Date    | Manual / Hoy   | Fecha de producción                 |
| ID          | Number  | Auto           | Correlativo automático              |
| CHASIS      | Text    | **QR Scan**    | Clave única - se escanea con la cámara |
| MODELO      | Text    | **Auto**       | Calculado desde prefijo del chasis  |
| CILINDRADA  | Number  | **Auto**       | Calculado desde prefijo del chasis  |
| NUM. MOTOR  | Text    | Manual         | Número de motor - debe ser único    |
| COLOR       | Enum    | Manual         | NEGRO / AZUL / GRIS / ROJO / NARANJA / BLANCO |
| RUEDA       | Text    | **Auto**       | ALEACION o RAYOS                    |
| OBS         | Text    | Manual         | Observaciones (opcional)            |
| COD MOD     | Text    | **Auto**       | Calculado desde prefijo del chasis  |
| COD MOTOR   | Text    | **Auto**       | Calculado desde prefijo del chasis  |

## Modelos registrados

| Prefijo Chasis | Modelo          | cc  | Rueda    | Cod Mod | Cod Motor |
|---------------|-----------------|-----|----------|---------|-----------|
| PPA1A         | Cub 110         | 110 | ALEACION | 1A      | 1P52FMH   |
| PPABA         | Urban 110       | 110 | RAYOS    | BA      | 1P52FMH   |
| PPA2B         | VX125           | 125 | ALEACION | 2B      | 1P53FMI   |
| PPAAD         | Super Sport 200 | 200 | ALEACION | AD      | 163FML    |
| PPAEE         | Rally 250       | 250 | RAYOS    | EE      | 165FMM    |
| PPAGC         | Faiter SE 150   | 150 | ALEACION | GC      | 162FMJ    |

## Validaciones

- **CHASIS único**: No se permiten dos motos con el mismo número de chasis
- **NUM. MOTOR único**: No se permiten dos motos con el mismo número de motor
- **Formato chasis**: Debe comenzar con "PPA" y tener al menos 15 caracteres
- **Prefijo motor**: El NUM. MOTOR debe comenzar con el COD MOTOR del modelo

## Archivos de configuración

```
columnas/
  PRODUCCION.yaml        - Definición de todas las columnas con fórmulas
  MODELOS_REF.yaml       - Tabla de referencia de modelos

expresiones/
  formulas_calculadas.yaml  - Fórmulas IFS para cálculo automático
  validaciones.yaml         - Expresiones Valid_if para unicidad y formato
  ux_vistas.yaml            - Configuración de vistas y formularios móvil
```
