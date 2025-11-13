// utils/csvParser.js
/**
 * Hàm parse CSV file buffer thành mảng object
 * - header: lấy từ dòng đầu
 *
 * Format CSV mẫu (header):
 * name,category,price,unit,description,stock,origin,supplier,image
 */

import { parse } from "csv-parse/sync";

export const parseCSV = (buffer) => {
  const content = buffer.toString("utf8");
  const records = parse(content, {
    columns: true, // sử dụng header
    skip_empty_lines: true,
    trim: true,
  });
  return records; // mảng object
};
