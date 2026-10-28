// MongoDB — 위스키 렌즈 전용 데이터베이스(MONGODB_DB=whiskylens).
// 보틀 렌즈와 같은 Atlas 클러스터(무료 등급)에 따로 만든 데이터베이스라, 보틀 렌즈 운영 데이터(winelens)와 섞이지 않는다.
// 서버에서만 쓴다. 개발 중 파일을 고쳐 다시 불러와도 접속이 쌓이지 않게 하나를 globalThis 에 둔다.
//
// 컬렉션: members(회원) · activity(저장·보내기·만들어 봄 기록) · settings(레시피·추천 설정) · banners(공지·배너)

import { MongoClient } from "mongodb";

const g = globalThis;

export async function getDb() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI 가 없어요(.env.local)");
  if (!g.__wlMongo) {
    const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 6000, maxPoolSize: 5 });
    g.__wlMongo = client.connect().catch((e) => {
      g.__wlMongo = null; // 다음 요청에서 다시 붙어 본다
      throw e;
    });
  }
  return (await g.__wlMongo).db(process.env.MONGODB_DB || "whiskylens");
}

/** 손님 화면용 — DB 가 안 되면 null. 화면은 코드에 적힌 기본값으로 돈다 */
export async function tryDb() {
  try {
    return await getDb();
  } catch (e) {
    console.error("[db]", e.message);
    return null;
  }
}
