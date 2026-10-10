const { QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const config = require('../config/env');
const {
  toNumber,
  formatMoney,
  trimString,
  formatDate,
  formatIsoDateTime
} = require('../utils/formatters');

/**
 * Sanitize menu category name for object key
 * @param {string} name 
 * @param {number|string} menuCode 
 * @returns {string}
 */
const sanitizeMenuName = (name, menuCode) => {
  const clean = (name || '').replace(/[^a-zA-Z0-9]/g, '');
  return clean.length > 0 ? clean : `Kind${menuCode}`;
};

/**
 * Basic Sales Report: Period totals (single query, no joins, no date grouping)
 * @param {Object} params
 * @param {string} params.dateFrom YYYY-MM-DD
 * @param {string} params.dateTo YYYY-MM-DD
 * @returns {Promise<Object>}
 */
const getBasicSalesReport = async ({ dateFrom, dateTo }) => {
  const sql = `
    SELECT
      COUNT(h.recno) AS chkQty,
      SUM(CASE WHEN h.chk_kind = 1 AND h.chk_stut IN (1,2,3,4,6,10) THEN 1 ELSE 0 END) AS deliveryQty,
      SUM(CASE WHEN h.chk_kind = 1 AND h.chk_stut IN (1,2,3,4,6,10) THEN h.net_price ELSE 0 END) AS delivery,
      SUM(h.net_price) AS netSales,
      SUM(h.sale_tax) AS tax,
      SUM(h.service_charge) AS service,
      SUM(h.discount) AS discount,
      SUM(h.cash) AS cash,
      SUM(h.visa) AS visa,
      SUM(CASE WHEN h.chk_stut IN (4, 10) THEN 1 ELSE 0 END) AS clChecksQty,
      SUM(CASE WHEN h.chk_stut IN (4, 10) THEN h.total ELSE 0 END) AS clChecksValue,
      SUM(CASE WHEN h.chk_stut IN (1,2,3,4,6,10) THEN h.total ELSE 0 END) AS totalRevenue
    FROM chk_heads h
    WHERE h.chk_date BETWEEN :dateFrom AND :dateTo
  `;

  const rows = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { dateFrom, dateTo }
  });

  const row = rows && rows.length > 0 ? rows[0] : {};

  return {
    dateFrom,
    dateTo,
    chkQty: toNumber(row.chkQty),
    deliveryQty: toNumber(row.deliveryQty),
    delivery: toNumber(row.delivery),
    netSales: toNumber(row.netSales),
    tax: toNumber(row.tax),
    service: toNumber(row.service),
    discount: toNumber(row.discount),
    cash: toNumber(row.cash),
    visa: toNumber(row.visa),
    clChecksQty: toNumber(row.clChecksQty),
    clChecksValue: toNumber(row.clChecksValue),
    totalRevenue: toNumber(row.totalRevenue)
  };
};

/**
 * Detailed Sales Report: Period totals with menu category pivot (2 queries + merge, no date grouping)
 * @param {Object} params
 * @param {string} params.dateFrom YYYY-MM-DD
 * @param {string} params.dateTo YYYY-MM-DD
 * @returns {Promise<Object>}
 */
const getDetailedSalesReport = async ({ dateFrom, dateTo }) => {
  const query1Sql = `
    WITH DailyDetails AS (
      SELECT
        ISNULL(SUM(CASE WHEN d.ent_item > 0 AND d.u_price = 0 THEN d.qty * d.ent_item ELSE 0 END), 0) AS compItemsValue,
        ISNULL(SUM(CASE WHEN d.ent_item > 0 AND d.u_price = 0 THEN d.qty ELSE 0 END), 0) AS compItemsQty,
        ISNULL(SUM(CASE WHEN d.void_qty > 0 THEN d.void_qty * d.u_price ELSE 0 END), 0) AS voidItemsValue,
        ISNULL(SUM(CASE WHEN d.void_qty > 0 THEN d.void_qty ELSE 0 END), 0) AS voidItemsQty
      FROM chk_heads h2
      JOIN chk_details d ON h2.recno = d.chk_recno
      WHERE h2.chk_date BETWEEN :dateFrom AND :dateTo
    )
    SELECT
      COUNT(h.recno) AS chkQty,
      SUM(CASE WHEN h.chk_stut = 1 THEN 1 ELSE 0 END) AS openCks,
      SUM(CASE WHEN h.chk_stut = 1 THEN h.total ELSE 0 END) AS openCksValue,
      SUM(CASE WHEN h.chk_kind = 1 AND h.chk_stut in (1,2,3,4,6,10) THEN 1 ELSE 0 END) AS deliveryQty,
      SUM(CASE WHEN h.chk_kind = 1 AND h.chk_stut in (1,2,3,4,6,10) THEN h.net_price ELSE 0 END) AS delivery,
      SUM(CASE WHEN h.chk_kind = 3 AND h.chk_stut in (1,2,3,4,6,10) THEN 1 ELSE 0 END) AS takeawayQty,
      SUM(CASE WHEN h.chk_kind = 3 AND h.chk_stut in (1,2,3,4,6,10) THEN h.net_price ELSE 0 END) AS takeaway,
      SUM(CASE WHEN h.chk_kind = 2 AND h.chk_stut in (1,2,3,4,6,10) THEN 1 ELSE 0 END) AS dinningQty,
      SUM(CASE WHEN h.chk_kind = 2 AND h.chk_stut in (1,2,3,4,6,10) THEN h.net_price ELSE 0 END) AS dinning,
      SUM(h.net_price) AS netSales,
      SUM(CASE WHEN h.chk_stut = 7 THEN 1 ELSE 0 END) AS compChksQty,
      SUM(CASE WHEN h.chk_stut = 7 THEN h.total ELSE 0 END) AS compChksValue,
      ISNULL(MAX(dd.compItemsValue), 0) AS compItemsValue,
      ISNULL(MAX(dd.compItemsQty), 0) AS compItemsQty,
      SUM(h.tips_cash) AS tipsCash,
      SUM(h.tips) AS tipsVisa,
      ISNULL(MAX(dd.voidItemsValue), 0) AS voidItemsValue,
      ISNULL(MAX(dd.voidItemsQty), 0) AS voidItemsQty,
      SUM(CASE WHEN h.chk_stut = 5 THEN 1 ELSE 0 END) AS voidChkQty,
      SUM(CASE WHEN h.chk_stut = 5 THEN h.void_chk ELSE 0 END) AS voidChkValue,
      SUM(h.discount) AS discount,
      SUM(CASE WHEN h.discount > 0 THEN 1 ELSE 0 END) AS discountQty,
      SUM(CASE WHEN h.chk_stut in(1,2,3,4,6,10) THEN h.enttax ELSE 0 END) AS entTax,
      SUM(CASE WHEN h.chk_stut in(1,2,3,4,6,10) THEN 1 ELSE 0 END) AS entTaxQty,
      SUM(h.service_charge) AS service,
      SUM(h.delivery_charge) AS deliveryCharge,
      SUM(CASE WHEN h.chk_stut in(1,2,3,4,6,10) THEN h.gust_no ELSE 0 END) AS noOfGuest,
      SUM(h.sale_tax) AS tax,
      SUM(CASE WHEN h.chk_stut in(1,2,3,4,6,10) THEN h.total ELSE 0 END) AS totalRevenue,
      SUM(CASE WHEN h.chk_stut = 8 THEN 1 ELSE 0 END) AS officerQty,
      SUM(CASE WHEN h.chk_stut = 8 THEN h.total ELSE 0 END) AS officerValue,
      SUM(CASE WHEN h.visa > 0 THEN 1 ELSE 0 END) AS visaChecksQty,
      SUM(h.visa) AS visaChecksValue,
      SUM(CASE WHEN h.chk_stut IN (4, 10) THEN 1 ELSE 0 END) AS clChecksQty,
      SUM(CASE WHEN h.chk_stut IN (4, 10) THEN h.total ELSE 0 END) AS clChecksValue,
      SUM(CASE WHEN h.cash > 0 THEN 1 ELSE 0 END) AS cashChecksQty,
      SUM(h.cash) AS cashChecksValue
    FROM chk_heads h
    CROSS JOIN DailyDetails dd
    WHERE h.chk_date BETWEEN :dateFrom AND :dateTo
  `;

  const query2Sql = `
    SELECT
      items_groups.kind AS menuCode,
      rtrim(menu_kind.menu_name) AS menuName,
      SUM(chk_details.qty * chk_details.u_price) AS value
    FROM chk_heads h
    INNER JOIN chk_details ON h.recno = chk_details.chk_recno
    INNER JOIN items ON chk_details.item_code = items.code
    INNER JOIN items_groups ON items.c_g = items_groups.code
    INNER JOIN menu_kind ON items_groups.kind = menu_kind.menu_code
    WHERE h.chk_date BETWEEN :dateFrom AND :dateTo
      AND h.chk_stut NOT IN (5, 7, 8, 9, 11)
      AND menu_kind.menu_code > 0
    GROUP BY items_groups.kind, menu_kind.menu_name
    ORDER BY items_groups.kind
  `;

  const [mainRows, menuRows] = await Promise.all([
    sequelize.query(query1Sql, {
      type: QueryTypes.SELECT,
      replacements: { dateFrom, dateTo }
    }),
    sequelize.query(query2Sql, {
      type: QueryTypes.SELECT,
      replacements: { dateFrom, dateTo }
    })
  ]);

  const rawMain = mainRows && mainRows.length > 0 ? mainRows[0] : {};

  const result = {
    dateFrom,
    dateTo
  };

  // Convert all Query 1 fields with toNumber()
  for (const [key, value] of Object.entries(rawMain)) {
    result[key] = toNumber(value);
  }

  // Ensure default zeroes if rawMain was empty
  const defaultFields = [
    'chkQty', 'openCks', 'openCksValue', 'deliveryQty', 'delivery',
    'takeawayQty', 'takeaway', 'dinningQty', 'dinning', 'netSales',
    'compChksQty', 'compChksValue', 'compItemsValue', 'compItemsQty',
    'tipsCash', 'tipsVisa', 'voidItemsValue', 'voidItemsQty',
    'voidChkQty', 'voidChkValue', 'discount', 'discountQty',
    'entTax', 'entTaxQty', 'service', 'deliveryCharge', 'noOfGuest',
    'tax', 'totalRevenue', 'officerQty', 'officerValue',
    'visaChecksQty', 'visaChecksValue', 'clChecksQty', 'clChecksValue',
    'cashChecksQty', 'cashChecksValue'
  ];

  for (const f of defaultFields) {
    if (result[f] === undefined) {
      result[f] = 0;
    }
  }

  // Derived fields:
  // gSales = netSales + service + tax + entTax + deliveryCharge
  result.gSales = toNumber(
    (result.netSales || 0) +
    (result.service || 0) +
    (result.tax || 0) +
    (result.entTax || 0) +
    (result.deliveryCharge || 0)
  );

  // cashInDrawer = cashChecksValue - tipsCash - tipsVisa
  result.cashInDrawer = toNumber(
    (result.cashChecksValue || 0) -
    (result.tipsCash || 0) -
    (result.tipsVisa || 0)
  );

  // Merge Query 2 menu categories directly
  for (const menuRow of menuRows) {
    const cleanName = sanitizeMenuName(menuRow.menuName, menuRow.menuCode);
    const key = `menu_${cleanName}_val`;
    result[key] = (result[key] || 0) + toNumber(menuRow.value);
  }

  return result;
};

/**
 * Map database chk_stut to business status
 * @param {number|string} chkStut 
 * @returns {string}
 */
const mapCheckStatus = (chkStut) => {
  const code = Number(chkStut);
  switch (code) {
    case 1:
      return 'OPEN';
    case 2:
    case 3:
    case 4:
    case 6:
    case 10:
      return 'CLOSED';
    case 5:
      return 'VOID';
    case 7:
      return 'COMP';
    case 8:
      return 'OFFICER';
    case 11:
      return 'FOOD TEST';
    default:
      return 'CLOSED';
  }
};

/**
 * Map database chk_kind to orderType
 * @param {number|string} chkKind 
 * @returns {string}
 */
const mapOrderType = (chkKind) => {
  const kind = Number(chkKind);
  switch (kind) {
    case 1:
      return 'DELIVERY';
    case 2:
      return 'DINE_IN';
    case 3:
      return 'TAKEAWAY';
    default:
      return 'DINE_IN';
  }
};

/**
 * Determine delivery company if order type is DELIVERY
 * @param {string} orderType 
 * @param {Object} row 
 * @returns {string|null}
 */
const getDeliveryCompany = (orderType, row) => {
  if (orderType !== 'DELIVERY') return null;
  const otlob = Number(row.otlob) || 0;
  const otlobId = trimString(row.otlobid);
  const elmenus = Number(row.Elmenus) || 0;

  if (otlob > 0 || otlobId.length > 0) {
    return 'Talabat';
  }
  if (elmenus > 0) {
    return 'Elmenus';
  }
  return '';
};

/**
 * Individual Checks Report: Detailed check breakdown with line items
 * @param {Object} params
 * @param {string} params.dateFrom YYYY-MM-DD
 * @param {string} params.dateTo YYYY-MM-DD
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @returns {Promise<Array<Object>>}
 */
const getChecksReport = async ({ dateFrom, dateTo, page, limit }) => {
  const paginationEnabled = page !== undefined || limit !== undefined;
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 50);
  const startRow = (pageNum - 1) * limitNum + 1;
  const endRow = pageNum * limitNum;

  const replacements = { dateFrom, dateTo };

  let checksSql;
  if (paginationEnabled) {
    replacements.startRow = startRow;
    replacements.endRow = endRow;
    checksSql = `
      WITH PaginatedChecks AS (
        SELECT
          h.recno,
          h.chk_no,
          CONVERT(varchar(10), h.chk_date, 120) AS businessDate,
          h.chk_date,
          h.chk_time,
          h.Close_time,
          h.chk_kind,
          h.chk_stut,
          h.net_price,
          h.service_charge,
          h.sale_tax,
          h.enttax,
          h.discount,
          h.total,
          h.otlob,
          h.otlobid,
          h.Elmenus,
          ROW_NUMBER() OVER (ORDER BY h.chk_date ASC, h.recno ASC) AS row_num
        FROM chk_heads h
        WHERE h.chk_date BETWEEN :dateFrom AND :dateTo
      )
      SELECT *
      FROM PaginatedChecks
      WHERE row_num BETWEEN :startRow AND :endRow
      ORDER BY row_num ASC
    `;
  } else {
    checksSql = `
      SELECT
        h.recno,
        h.chk_no,
        CONVERT(varchar(10), h.chk_date, 120) AS businessDate,
        h.chk_date,
        h.chk_time,
        h.Close_time,
        h.chk_kind,
        h.chk_stut,
        h.net_price,
        h.service_charge,
        h.sale_tax,
        h.enttax,
        h.discount,
        h.total,
        h.otlob,
        h.otlobid,
        h.Elmenus
      FROM chk_heads h
      WHERE h.chk_date BETWEEN :dateFrom AND :dateTo
      ORDER BY h.chk_date ASC, h.recno ASC
    `;
  }

  const checkRows = await sequelize.query(checksSql, {
    type: QueryTypes.SELECT,
    replacements
  });

  if (!checkRows || checkRows.length === 0) {
    return [];
  }

  const checkRecnos = checkRows.map((r) => r.recno);

  let detailsSql = `
    SELECT
      d.chk_recno,
      d.ser,
      d.item_code,
      d.qty,
      d.u_price,
      d.void_qty,
      d.Void_Stuts,
      d.it_time,
      d.void_time,
      i.item AS itemName,
      i.A_item AS itemArabicName,
      ig.item_group_name AS categoryName
    FROM chk_details d
    LEFT JOIN items i ON d.item_code = i.code
    LEFT JOIN items_groups ig ON i.c_g = ig.code
  `;

  let detailsRows = [];
  if (paginationEnabled || checkRecnos.length <= 2000) {
    detailsSql += ` WHERE d.chk_recno IN (:checkRecnos) ORDER BY d.chk_recno ASC, d.ser ASC`;
    detailsRows = await sequelize.query(detailsSql, {
      type: QueryTypes.SELECT,
      replacements: { checkRecnos }
    });
  } else {
    detailsSql += `
      INNER JOIN chk_heads h ON d.chk_recno = h.recno
      WHERE h.chk_date BETWEEN :dateFrom AND :dateTo
      ORDER BY d.chk_recno ASC, d.ser ASC
    `;
    detailsRows = await sequelize.query(detailsSql, {
      type: QueryTypes.SELECT,
      replacements: { dateFrom, dateTo }
    });
  }

  // Group details by chk_recno
  const detailsByCheck = new Map();
  for (const item of detailsRows) {
    if (!detailsByCheck.has(item.chk_recno)) {
      detailsByCheck.set(item.chk_recno, []);
    }
    detailsByCheck.get(item.chk_recno).push(item);
  }

  const decimals = config.decimalPlaces;

  const result = checkRows.map((row) => {
    const status = mapCheckStatus(row.chk_stut);
    const orderType = mapOrderType(row.chk_kind);
    const deliveryCompany = getDeliveryCompany(orderType, row);

    const businessDate = row.businessDate || formatDate(row.chk_date);
    const openedAt = formatIsoDateTime(row.chk_time, businessDate);

    let closedAt = null;
    if (status !== 'OPEN') {
      const closeTimeStr = trimString(row.Close_time);
      if (closeTimeStr) {
        closedAt = formatIsoDateTime(closeTimeStr, businessDate);
      } else {
        closedAt = openedAt;
      }
    }

    const checkItemsRaw = detailsByCheck.get(row.recno) || [];
    let latestVoidTime = null;

    const items = [];
    for (const item of checkItemsRaw) {
      const voidQty = toNumber(item.void_qty);
      const voidTimeStr = trimString(item.void_time);
      if (voidQty > 0 && voidTimeStr) {
        if (!latestVoidTime || voidTimeStr > latestVoidTime) {
          latestVoidTime = voidTimeStr;
        }
      }

      const name = trimString(item.itemName) || trimString(item.itemArabicName) || `Item ${item.item_code}`;
      const category = trimString(item.categoryName) || 'General';
      const unitPrice = formatMoney(item.u_price, decimals);
      const qty = toNumber(item.qty);

      if (qty > 0 && voidQty === 0) {
        items.push({
          name,
          category,
          qty,
          unitPrice,
          total: formatMoney(qty * item.u_price, decimals),
          voided: false
        });
      } else if (qty === 0 && voidQty > 0) {
        items.push({
          name,
          category,
          qty: voidQty,
          unitPrice,
          total: formatMoney(voidQty * item.u_price, decimals),
          voided: true
        });
      } else if (qty > 0 && voidQty > 0) {
        items.push({
          name,
          category,
          qty,
          unitPrice,
          total: formatMoney(qty * item.u_price, decimals),
          voided: false
        });
        items.push({
          name,
          category,
          qty: voidQty,
          unitPrice,
          total: formatMoney(voidQty * item.u_price, decimals),
          voided: true
        });
      } else {
        items.push({
          name,
          category,
          qty: 0,
          unitPrice,
          total: 0,
          voided: false
        });
      }
    }

    let updatedAt = closedAt || openedAt;
    if (latestVoidTime) {
      updatedAt = formatIsoDateTime(latestVoidTime, businessDate) || updatedAt;
    }

    const checkObj = {
      checkNo: toNumber(row.recno),
      businessDate,
      openedAt,
      closedAt,
      orderType,
      deliveryCompany
    };

    checkObj.netSales = formatMoney(row.net_price, decimals);
    checkObj.service = formatMoney(row.service_charge, decimals);
    checkObj.tax = formatMoney(row.sale_tax, decimals);

    const entTax = toNumber(row.enttax);
    if (entTax > 0) {
      checkObj.entTax = formatMoney(entTax, decimals);
    }

    checkObj.discount = formatMoney(row.discount, decimals);
    checkObj.total = formatMoney(row.total, decimals);
    checkObj.status = status;
    checkObj.updatedAt = updatedAt;
    checkObj.items = items;

    return checkObj;
  });

  return result;
};

module.exports = {
  getBasicSalesReport,
  getDetailedSalesReport,
  getChecksReport,
  sanitizeMenuName,
  mapCheckStatus,
  mapOrderType,
  getDeliveryCompany
};
