import assert from "assert";
import {
  getLocationList,
  addLocation,
  updateLocation,
  deleteLocation,
  bulkImportLocations,
} from "./games/spyfall/index.js";
import {
  getDrawWordsList,
  addDrawWord,
  updateDrawWord,
  deleteDrawWord,
  bulkImportDrawWords,
} from "./games/drawguess/index.js";
import {
  getWordBankList,
  addWordPair,
  updateWordPair,
  deleteWordPair,
} from "./gameManager.js";

console.log("▶ Testing Dynamic Dataset Management for All Games...");

// 1. Test Spyfall Locations CRUD
const initialLocationsCount = getLocationList().length;
console.log(`ℹ Initial Spyfall locations count: ${initialLocationsCount}`);

const newLocRes = addLocation({
  name: "Stasiun Luar Angkasa Test",
  category: "Sains & Fiksi",
  roles: ["Komandan Stasiun", "Ilmuwan Biologi", "Teknisi Oksigen", "Astronot Pemula"],
});
assert.strictEqual(newLocRes.success, true);
assert.ok(newLocRes.location.id);
assert.strictEqual(getLocationList().length, initialLocationsCount + 1);
console.log("✔ Spyfall addLocation passed");

const locId = newLocRes.location.id;
const updateLocRes = updateLocation(locId, {
  name: "Stasiun Mars Koloni Test",
  category: "Luar Angkasa",
  roles: ["Kolonis Pertama", "Geolog Mars", "Dokter Koloni"],
});
assert.strictEqual(updateLocRes.success, true);
assert.strictEqual(updateLocRes.location.name, "Stasiun Mars Koloni Test");
console.log("✔ Spyfall updateLocation passed");

const deleteLocRes = deleteLocation(locId);
assert.strictEqual(deleteLocRes.success, true);
assert.strictEqual(getLocationList().length, initialLocationsCount);
console.log("✔ Spyfall deleteLocation passed");

// 2. Test Draw & Guess Words CRUD
const initialDrawWordsCount = getDrawWordsList().length;
console.log(`ℹ Initial Draw & Guess words count: ${initialDrawWordsCount}`);

const newDrawRes = addDrawWord({
  word: "Sepeda Terbang Test",
  category: "Kendaraan",
  difficulty: "Sedang",
});
assert.strictEqual(newDrawRes.success, true);
assert.strictEqual(getDrawWordsList().length, initialDrawWordsCount + 1);
console.log("✔ Draw & Guess addDrawWord passed");

const addedWordIdx = getDrawWordsList().length - 1;
const updateDrawRes = updateDrawWord(addedWordIdx, {
  word: "Mobil Terbang Test",
  category: "Kendaraan Masa Depan",
  difficulty: "Sulit",
});
assert.strictEqual(updateDrawRes.success, true);
assert.strictEqual(getDrawWordsList()[addedWordIdx].word, "Mobil Terbang Test");
console.log("✔ Draw & Guess updateDrawWord passed");

const deleteDrawRes = deleteDrawWord(addedWordIdx);
assert.strictEqual(deleteDrawRes.success, true);
assert.strictEqual(getDrawWordsList().length, initialDrawWordsCount);
console.log("✔ Draw & Guess deleteDrawWord passed");

// 3. Test Undercover CRUD
const initialWordsCount = getWordBankList().length;
const newPairRes = addWordPair({
  category: "Uji Coba",
  civilian: "Bakso Sapi Test",
  undercover: "Bakso Urat Test",
});
assert.strictEqual(newPairRes.success, true);
assert.strictEqual(getWordBankList().length, initialWordsCount + 1);

const deleteWordRes = deleteWordPair(getWordBankList().length - 1);
assert.strictEqual(deleteWordRes.success, true);
assert.strictEqual(getWordBankList().length, initialWordsCount);
console.log("✔ Undercover CRUD passed");

console.log("\n🎉 ALL DATASET CRUD OPERATIONS PASSED WITH 100% SUCCESS!");
