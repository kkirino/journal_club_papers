const ss = SpreadsheetApp.getActiveSpreadsheet();

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("サイドバーを開く")
    .addItem("開く", "openSidebar")
    .addToUi();
}

function openSidebar() {
  const htmlOutput = HtmlService.createTemplateFromFile("sidebar").evaluate();
  SpreadsheetApp.getUi().showSidebar(htmlOutput);
}

function getSettings() {
  const ws = ss.getSheetByName("settings");
  const numRow = ws.getLastRow() - 1;
  const titles = ws
    .getRange(2, 1, numRow, 1)
    .getValues()
    .map(function (row) {
      return row[0];
    });
  const values = ws
    .getRange(2, 2, numRow, 1)
    .getValues()
    .map(function (row) {
      return row[0];
    });
  const dayOfWeekArray = ["日", "月", "火", "水", "木", "金", "土"];
  const settings = {};
  settings.dayOfWeek = dayOfWeekArray.indexOf(
    values[titles.indexOf("抄読会開催曜日")]
  );
  settings.manualPageUrl = values[titles.indexOf("マニュアルページのURL")];
  settings.webAppUrl = values[titles.indexOf("WebアプリのURL")];
  return settings;
}

function userClicked(userInfo) {
  if (userInfo.date == "" || userInfo.pubmedId == "") {
    return "フォームの入力項目をすべて埋めてください";
  } else {
    const url =
      "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=" +
      Number(userInfo.pubmedId);
    const xml = UrlFetchApp.fetch(url).getContentText();
    const document = XmlService.parse(xml);
    const root = document.getRootElement();
    const items = root.getChildren()[0].getChildren();
    if (items.length === 0) {
      return "入力された PubMed ID は存在しません";
    } else {
      const title = items[6].getText();
      const journal = items[3].getText();
      const ws = ss.getSheetByName("list");
      ws.appendRow([
        new Date(),
        userInfo.date,
        userInfo.pubmedId,
        title,
        journal,
      ]);
      return title + " が入力されました";
    }
  }
}

function doGet() {
  return HtmlService.createTemplateFromFile("index").evaluate();
}

function getTable() {
  const ws = ss.getSheetByName("list");
  const numRow = ws.getLastRow() - 1;
  const numCol = ws.getLastColumn();
  const dataInSheet = ws.getRange(2, 1, numRow, numCol).getValues();
  const paperList = dataInSheet.map(function (row) {
    return {
      date: new Date(row[1]).toLocaleDateString(),
      title: row[3],
      journal: row[4],
      pubmedId: row[2],
    };
  });
  let tableText = "";
  paperList.forEach(function (e) {
    const rowText =
      "<tr><td>" +
      e.date +
      "</td>" +
      "<td>" +
      e.title +
      "<a href='https://pubmed.ncbi.nlm.nih.gov/" +
      e.pubmedId +
      "/' target='_blank' rel='noopener noreferrer'><i class='bi bi-link'></i></a>" +
      "</td>" +
      "<td><i>" +
      e.journal +
      "</i></td></tr>";
    tableText += rowText;
  });
  return tableText;
}
