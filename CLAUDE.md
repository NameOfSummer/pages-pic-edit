# CLAUDE.md

pic-edit はブラウザだけで動く画像注釈アプリ。透明な市松模様のキャンバスに画像を置き、矢印・矩形・テキスト・番号カウンター・モザイク・蛍光ペンで注釈を付けて、透過 PNG として書き出す。機能とコーディング規約の正は README.md。

## アーキテクチャ

- **エディタは DOM で描画し、canvas を使うのは書き出し時だけ。** 画像と注釈は位置指定した DOM/SVG 要素として描画する（`components/*View.tsx`、`LayerImage.tsx`）。`src/editor/export.ts` は `*Geometry.ts` の描画関数を使って、`Editor.tsx` の DOM と同じ重なり順（下 → 上）ですべてを `<canvas>` に描き直す。View の見た目を変えたら geometry / export 側の描画にも必ず同じ変更を入れること。入れないと PNG が画面表示と食い違う。
- **`Editor.tsx` が全体の司令塔**（約 2000 行）: ツール切替（`types.ts` の `EditorTool`）、ポインター処理、キーボードショートカット、クリップボード、トリミング、スポイト、コンテキストメニュー、書き出し。注釈の種類ごとの state はそれぞれ専用の hook（`src/editor/use*.ts`）にあり、add / update / remove を公開している。画像レイヤーは `useLayers` が扱う。
- **Undo/redo はスナップショット方式。** `history.ts` は `EditorSnapshot`（全レイヤーと全注釈の配列）を丸ごと保存する。`Editor.tsx` は最新の state を写した `docRef` を保持しているので、`takeSnapshot()` は常に最新の状態を返す。単発の変更の前には `pushHistory()` を呼び、ドラッグでは `beginGesture()` を使う（`gestureRef` で制御され、1 ジェスチャーにつき 1 回だけ push される）。
- **更新はパッチで渡す。** hook はオブジェクト全体ではなく `*Patch` 型（変更したフィールドだけ）を受け取る。ドラッグ中はビューポートの `clientX` / `clientY` をそのまま使い、確定する値は `Math.round` で丸める。
- **スポイト**は `EyedropperContext`（`useEyedropper()`）経由でスタイル設定 UI に提供される。実装は `Editor.tsx` と `eyedropper.ts`。

### 注釈の種類を追加するとき

次のすべてに手を入れる（README の「注釈を足すとき」を参照）:
`types.ts`（注釈の型、`*Patch`、`DEFAULT_*`）、`use*.ts` hook（id は `crypto.randomUUID()` で生成）、`*Geometry.ts`（座標計算と canvas 描画。React コンポーネント内には書かない）、`*View.tsx`、`*SelectionChrome.tsx`、`*StyleControls.tsx`、さらに `history.ts`（`EditorSnapshot` / `cloneSnapshot`）、`export.ts`、`annotationClipboard.ts`、`Editor.tsx` / `Toolbar.tsx` のツール切替。

## 規約

- 1 ファイルにつき 1 コンポーネントとし、ファイル名は export 名と同じにする。未使用の変数・引数には `_` を付ける。
- コミットの 1 行目には変更の理由を書く。
