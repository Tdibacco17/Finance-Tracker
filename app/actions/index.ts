'use server'
import { sheets } from '@/lib/sheets';
import { revalidatePath } from 'next/cache';

const parsePrecioCompra = (precio: string): number => {
    return parseFloat(precio.replace(',', '.').replace('$', '').trim());  // Limpiar el valor y convertirlo a número
};

const parsePrecioConPunto = (precio: string): number => {
    return parseFloat(precio.replace(',', '.').trim());  // Convertir coma a punto y parsear a número
};

export type SheetRow = string[]; // Cada fila es un array de strings
export type SheetData = SheetRow[]; // La respuesta es un array de filas
export type ApiResponse = { success: boolean, message: string }

type Compra = {
    ticker: string;
    cantidad: string;
    fechaDeCompra: string;
    precioCompra: string;
    precioActual: string;
    totalCompra: string;
    totalActual: string;
    gananciaPerdidaDolares: string;
    gananciaPerdidaPorcentaje: string;
};

export const GetSheetData = async (): Promise<SheetData> => {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const range = 'sheet1!A:Z';

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
    });

    const rows = response.data.values || [];

    const filteredData = rows.filter(row => row.some(cell => cell.trim() !== ''));

    return filteredData;
}

export const GetSheet2Data = async (): Promise<SheetData> => {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;  // Asegúrate de tener esta variable de entorno configurada
    const range = 'sheet2!A:Z';  // Rango que corresponde a la hoja 2

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
    });

    const rows = response.data.values || [];

    // Filtrar las filas que contienen datos, es decir, que no están vacías
    const filteredData = rows.filter(row => row.some(cell => cell.trim() !== ''));

    return filteredData;
};

export const AddDataToSheet = async (ticker: string, cantidad: string, fecha: string, precioCompra: string): Promise<ApiResponse> => {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const rangeSheet1 = 'sheet1!A:E';
    const rangeSheet2 = 'sheet2!A:I';

    // Parsear el precioCompra
    const precioCompraNum = parsePrecioCompra(precioCompra);

    // Crear nueva fila para Sheet1
    const nuevaFilaSheet1 = [
        [
            `=GOOGLEFINANCE("${ticker}";"name")`, // Nombre
            ticker, // Ticker
            cantidad, // Cantidad
            fecha, // Fecha
            precioCompraNum.toFixed(2).replace('.', ','), // Precio compra formateado
        ],
    ];

    try {
        // Agregar datos a Sheet1
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: rangeSheet1,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: nuevaFilaSheet1 },
        });

        // Consultar datos existentes en Sheet2
        const sheet2DataResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: rangeSheet2,
        });

        const sheet2Data = sheet2DataResponse.data.values || [];

        // Buscar si ya existe el ticker en Sheet2
        const existingRowIndex = sheet2Data.findIndex(row => row[1] === ticker); // Columna B es el ticker
        const cantidadNum = parseFloat(cantidad);

        if (existingRowIndex !== -1) {
            // Si existe, actualizar la cantidad y el precio promedio (PPC)
            const existingRow = sheet2Data[existingRowIndex];
            const existingCantidad = parseFloat(existingRow[2]); // Columna C es la cantidad
            const existingPPC = parsePrecioCompra(existingRow[6]); // Columna G es el PPC

            // Verificar los valores antes de continuar
            console.log('existingCantidad:', existingCantidad);
            console.log('existingPPC:', existingPPC);

            const nuevaCantidad = existingCantidad + cantidadNum;

            let nuevoPPC = 0;
            if (existingCantidad !== 0 && !isNaN(existingPPC)) {
                // Calcular PPC ponderado
                nuevoPPC = ((existingCantidad * existingPPC) + (cantidadNum * precioCompraNum)) / nuevaCantidad;
            } else {
                // Si no hay PPC válido, asignar el precio de compra como PPC
                nuevoPPC = precioCompraNum;
            }

            console.log('Nuevo PPC:', nuevoPPC);

            sheet2Data[existingRowIndex] = [
                existingRow[0], // Nombre
                ticker,
                nuevaCantidad.toString(),
                `=GOOGLEFINANCE("${ticker}";"changepct")/100`, // 24 Hs %
                `=GOOGLEFINANCE("${ticker}";"price")`, // Precio actual
                `=GOOGLEFINANCE("${ticker}";"price")*${nuevaCantidad}`, // Monto actual
                nuevoPPC.toFixed(2).replace('.', ','), // Nuevo PPC formateado
                `=GOOGLEFINANCE("${ticker}";"price")*${nuevaCantidad}-${nuevoPPC.toFixed(2).replace('.', ',')}*${nuevaCantidad}`, // -/+ $ (fórmula)
                `=GOOGLEFINANCE("${ticker}";"price")*${nuevaCantidad}/(${nuevoPPC.toFixed(2).replace('.', ',')}*${nuevaCantidad})-1`, // -/+ % (fórmula)
            ];
        } else {
            // Si no existe, agregar un nuevo registro
            const nuevaFilaSheet2 = [
                `=GOOGLEFINANCE("${ticker}";"name")`, // Nombre
                ticker,
                cantidad, // Cantidad
                `=GOOGLEFINANCE("${ticker}";"changepct")/100`, // 24 Hs %
                `=GOOGLEFINANCE("${ticker}";"price")`, // Precio actual
                `=GOOGLEFINANCE("${ticker}";"price")*${cantidadNum}`, // Monto actual
                precioCompraNum.toFixed(2).replace('.', ','), // PPC inicial
                `=GOOGLEFINANCE("${ticker}";"price")*${cantidadNum}-(${precioCompraNum.toFixed(2).replace('.', ',')}*${cantidadNum})`, // -/+ $
                `=GOOGLEFINANCE("${ticker}";"price")*${cantidadNum}/(${precioCompraNum.toFixed(2).replace('.', ',')}*${cantidadNum})-1`, // -/+ %
            ];
            sheet2Data.push(nuevaFilaSheet2);
        }

        // Escribir los datos actualizados en Sheet2
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: rangeSheet2,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: sheet2Data },
        });

        console.log('Datos agregados y actualizados exitosamente.');
        revalidatePath('/')
        return { success: true, message: 'Datos agregados correctamente a ambas hojas' };
    } catch (error) {
        console.error('Error al agregar datos:', error);
        return { success: false, message: 'Error al agregar datos' };
    }
};

// export const DeleteRowFromSheet = async (rowIndex: number): Promise<ApiResponse> => {
//     const spreadsheetId = process.env.GOOGLE_SHEET_ID;  // ID de la hoja de cálculo

//     // Crear la solicitud para eliminar la fila
//     const request = {
//         requests: [
//             {
//                 deleteDimension: {
//                     range: {
//                         sheetId: 0,  // El ID de la hoja (si es la primera hoja, generalmente es 0)
//                         dimension: 'ROWS',
//                         startIndex: rowIndex - 1,  // El índice de la fila (0-based, por eso restamos 1)
//                         endIndex: rowIndex,  // Solo eliminamos una fila, así que el rango es el mismo
//                     },
//                 },
//             },
//         ],
//     };

//     try {
//         const response = await sheets.spreadsheets.batchUpdate({
//             spreadsheetId,
//             requestBody: request,
//         });
//         console.log('Fila eliminada exitosamente:', response.data);
//         revalidatePath('/')
//         return { success: true, message: 'Fila eliminada correctamente' };
//     } catch (error) {
//         console.error('Error al eliminar fila:', error);
//         return { success: false, message: 'Error al eliminar fila' };
//     }
// };