# 🎂 ハピバメーカー

名前とメッセージを入れるだけで、**うごく誕生日カードGIF**が作れるツール。
LINE でそのまま送れる。

- 完全ブラウザ内完結（**サーバー不要・月額0円**）
- GIF生成もチャット編集も**すべてクライアントサイド**
- チャット編集は**AI APIを使わない**ルールベース（コストゼロ）
- 課金は Gumroad のライセンスキー方式（透かし消し・高画質を 100円買い切りで解除）

---

## つかい方（利用者）

1. 相手の名前とメッセージを入れる
2. 「文字を赤くして」「背景を夜空に」などチャットで見た目を調整
3. 「GIFを作る」→ 保存 / 共有（スマホなら LINE に直接送れる）

無料＝透かしあり・320px / 100円解除＝透かしなし・512px。

---

## 公開する（GitHub Pages）

1. リポジトリの **Settings → Pages**
2. Source: **Deploy from a branch** → Branch: `master` / フォルダ `/(root)`
3. 数分後、以下でアクセスできる：
   ```
   https://<ユーザー名>.github.io/asobiba/apps/hbd/
   ```

> 検証中はこの作業ブランチを一時的に Pages のブランチに指定してもOK。

---

## お金を受け取れるようにする（Gumroad）

投げ銭ではなく「透かしを消す権利」を売る方式。スマホだけで設定できます。

1. [gumroad.com](https://gumroad.com) でアカウント作成（受取のため本人確認あり）
2. **New product → Digital product** を作成
   - 価格: **100円**（または好きな額）
   - 中身: 「透かし解除ライセンス」だけでOK（ファイルは空でも可）
   - **Settings → "Generate a unique license key per sale" を ON**
3. 商品URL末尾の permalink を確認
   例: `https://gumroad.com/l/hbdmaker` → permalink は `hbdmaker`
4. `index.html` 冒頭の設定を書き換える：
   ```js
   window.GUMROAD = {
     permalink: 'hbdmaker',
     productUrl: 'https://gumroad.com/l/hbdmaker'
   };
   ```
5. commit & push → 完了。購入者はキーを貼って「解除」を押すと透かしが消える。

> ライセンス確認は Gumroad の verify API をブラウザから直接叩くので、
> こちら側のサーバーは一切不要です。

---

## これから増やせるもの

- テンプレ追加（`buildParticles` / `drawFrame` にケース追加。テンプレ単位で有料化も可）
- お礼・お祝い・推しの誕生日など用途拡張
- MP4書き出し、フォント選択、写真の埋め込み
