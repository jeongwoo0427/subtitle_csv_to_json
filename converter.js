const fs = require('fs').promises;
const csv = require('csvtojson');
const path = require('path');
const readline = require("readline");

const directoryPath = './target_csv'; // CSV 파일이 위치한 디렉토리
const outputDirectory = './target_json'; // 결과 JSON 파일을 저장할 디렉토리

//콘솔 입력 대기를 위한 readline객체
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const CSV_COL_NAMES = {
  Start_Time: 'Start Time',
  End_Time: 'End Time',
  Text: 'Text',
  Layer_ID: 'Layer ID'
}

const JSON_COL_NAMES = {
  startTime: 'startTime',
  endTime: 'endTime',
  text: 'text',
  layerID: 'layerID'
}


// 시간 문자열을 초로 변환하는 함수
function timeToSeconds(time) {
  const [hours, minutes, seconds, fraction] = time.split(';').map(parseFloat);
  if(hours ==null || minutes ==null || seconds ==null || fraction ==null) throw `time parsing error (${time})`;
  return hours * 3600 + minutes * 60 + seconds + fraction * 0.01;
}

const convertCsvToJson = async (filePath, outputFilePath) => {
  // csvtojson 라이브러리를 사용하여 CSV 파일을 JSON 배열로 변환
  const jsonArray = await csv({
    noheader: false,
    headers: [JSON_COL_NAMES.startTime, JSON_COL_NAMES.endTime, JSON_COL_NAMES.text, JSON_COL_NAMES.layerID],
    colParser: {
      [CSV_COL_NAMES.Start_Time]: 'string',
      [CSV_COL_NAMES.End_Time]: 'string',
      [CSV_COL_NAMES.Text]: 'string',
      [CSV_COL_NAMES.Layer_ID]: 'string'
    },

    checkType: true
  }).fromFile(filePath);

  // Start Time 또는 End Time이 비어 있거나 null인 객체는 제거
  const filteredJsonArray = jsonArray.filter(item => item[JSON_COL_NAMES.startTime] && item[JSON_COL_NAMES.endTime]);

  // startTime 과 endTime의 시간 단위 변경
  filteredJsonArray.forEach((item) => {
    item[JSON_COL_NAMES.startTime] = timeToSeconds(item[JSON_COL_NAMES.startTime]);
    item[JSON_COL_NAMES.endTime] = timeToSeconds(item[JSON_COL_NAMES.endTime]);
  });

  // JSON 파일로 저장
  await fs.writeFile(outputFilePath, JSON.stringify(filteredJsonArray, null, 2));
  console.log(`완료 ${path.basename(filePath)} to ${path.basename(outputFilePath)}`);
};

const startProcess = async () => {
  const files = await fs.readdir(directoryPath);

  for (const file of files) {
    try {
      if (path.extname(file) === '.csv') {
        const filePath = path.join(directoryPath, file);
        const outputFilePath = path.join(outputDirectory, path.basename(file, '.csv') + '.json');
        await convertCsvToJson(filePath, outputFilePath);
      }
    } catch (err) {
      console.error(`오류발생!!!!!!!!!!!!! (위치 : ${file})`, err);
    }
  }


  console.log('모든 처리가 완료되었습니다. Enter로 나가십쇼.')

  rl.on("line", (line) => {
    // 한 줄씩 입력받은 후 실행할 코드
    // 입력된 값은 line에 저장된다.
    rl.close(); // 필수!! close가 없으면 입력을 무한히 받는다.
  });
  rl.on('close', () => {
    // 입력이 끝난 후 실행할 코드
    process.exit();
  })
};

startProcess();