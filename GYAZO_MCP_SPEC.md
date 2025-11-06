# Gyazo MCP Server 仕様書

## 概要

Gyazo MCPサーバーは、Model Context Protocol (MCP)を使用してGyazo APIにアクセスするためのサーバー実装です。AIアシスタントがGyazoの画像共有機能を利用できるようにします。

## 技術スタック

- **言語**: TypeScript
- **フレームワーク**: @modelcontextprotocol/sdk
- **Gyazo API**: REST API (https://api.gyazo.com, https://upload.gyazo.com)
- **認証**: OAuth 2.0 / アクセストークン
- **トランスポート**: stdio

## Gyazo API エンドポイント

### 1. 画像アップロード
- **エンドポイント**: `POST https://upload.gyazo.com/api/upload`
- **認証**: 必須
- **パラメータ**:
  - `access_token`: アクセストークン
  - `imagedata`: base64エンコードされた画像データ
  - `title` (オプション): 画像タイトル
  - `desc` (オプション): 画像説明
  - `collection_id` (オプション): コレクションID
  - `referer_url` (オプション): 参照元URL
  - `app` (オプション): アプリ名
- **レスポンス**:
  ```json
  {
    "image_id": "xxxxx",
    "permalink_url": "https://gyazo.com/xxxxx",
    "thumb_url": "https://thumb.gyazo.com/thumb/xxxxx.png",
    "url": "https://i.gyazo.com/xxxxx.png",
    "type": "png"
  }
  ```

### 2. 画像一覧取得
- **エンドポイント**: `GET https://api.gyazo.com/api/images`
- **認証**: 必須
- **パラメータ**:
  - `access_token`: アクセストークン
  - `page` (オプション): ページ番号 (デフォルト: 1)
  - `per_page` (オプション): 1ページあたりの件数 (デフォルト: 20, 最大: 100)
- **レスポンス**: 画像オブジェクトの配列

### 3. 画像詳細取得
- **エンドポイント**: `GET https://api.gyazo.com/api/images/{image_id}`
- **認証**: 必須
- **レスポンス**:
  ```json
  {
    "image_id": "xxxxx",
    "permalink_url": "https://gyazo.com/xxxxx",
    "thumb_url": "https://thumb.gyazo.com/thumb/xxxxx.png",
    "url": "https://i.gyazo.com/xxxxx.png",
    "type": "png",
    "created_at": "2025-01-01T00:00:00+0000",
    "metadata": {
      "app": null,
      "title": null,
      "url": null,
      "desc": null
    },
    "ocr": {
      "locale": "en",
      "description": "..."
    }
  }
  ```

### 4. 画像削除
- **エンドポイント**: `DELETE https://api.gyazo.com/api/images/{image_id}`
- **認証**: 必須
- **レスポンス**:
  ```json
  {
    "image_id": "xxxxx",
    "type": "png"
  }
  ```

### 5. oEmbed API
- **エンドポイント**: `GET https://api.gyazo.com/api/oembed`
- **パラメータ**:
  - `url`: Gyazo画像URL
- **レスポンス**: oEmbed形式のメタデータ

## MCP Tools 実装

### Tool 1: upload_image
画像をGyazoにアップロードします。

**入力スキーマ**:
```typescript
{
  imagedata: string,      // base64エンコードされた画像データ
  title?: string,         // 画像タイトル
  desc?: string,          // 画像説明
  collection_id?: string, // コレクションID
  referer_url?: string    // 参照元URL
}
```

**出力**:
```typescript
{
  type: "text",
  text: JSON.stringify({
    image_id: string,
    permalink_url: string,
    url: string,
    thumb_url: string,
    type: string
  })
}
```

### Tool 2: list_images
ユーザーの画像一覧を取得します。

**入力スキーマ**:
```typescript
{
  page?: number,     // ページ番号 (デフォルト: 1)
  per_page?: number  // 1ページあたりの件数 (デフォルト: 20)
}
```

**出力**:
```typescript
{
  type: "text",
  text: JSON.stringify([
    {
      image_id: string,
      permalink_url: string,
      url: string,
      created_at: string,
      metadata: {...}
    }
  ])
}
```

### Tool 3: get_image
特定の画像の詳細情報を取得します。

**入力スキーマ**:
```typescript
{
  image_id: string  // 画像ID
}
```

**出力**:
```typescript
{
  type: "text",
  text: JSON.stringify({
    image_id: string,
    permalink_url: string,
    url: string,
    thumb_url: string,
    type: string,
    created_at: string,
    metadata: {...},
    ocr?: {...}
  })
}
```

### Tool 4: delete_image
画像を削除します。

**入力スキーマ**:
```typescript
{
  image_id: string  // 削除する画像のID
}
```

**出力**:
```typescript
{
  type: "text",
  text: JSON.stringify({
    success: boolean,
    image_id: string,
    message: string
  })
}
```

### Tool 5: get_oembed
画像のoEmbed情報を取得します。

**入力スキーマ**:
```typescript
{
  url: string  // Gyazo画像URL
}
```

**出力**:
```typescript
{
  type: "text",
  text: JSON.stringify({
    ...oEmbedData
  })
}
```

## MCP Resources 実装

### Resource 1: gyazo://images
ユーザーの画像一覧をリソースとして公開します。

**URI**: `gyazo://images`
**MIMEタイプ**: `application/json`
**説明**: ユーザーがアップロードした全画像のリスト

### Resource 2: gyazo://images/{image_id}
特定の画像をリソースとして公開します。

**URI**: `gyazo://images/{image_id}`
**MIMEタイプ**: `application/json`
**説明**: 特定の画像の詳細情報

## 認証設定

### 環境変数
```bash
GYAZO_ACCESS_TOKEN=your_access_token_here
```

### OAuth 2.0フロー（将来的な拡張）
1. クライアントIDとシークレットの取得
2. 認証URLの生成
3. アクセストークンの取得
4. トークンのリフレッシュ

## プロジェクト構造

```
gyazo-mcp/
├── src/
│   ├── index.ts           # エントリーポイント
│   ├── server.ts          # MCPサーバー実装
│   ├── gyazo-client.ts    # Gyazo APIクライアント
│   ├── tools/             # ツール実装
│   │   ├── upload.ts
│   │   ├── list.ts
│   │   ├── get.ts
│   │   ├── delete.ts
│   │   └── oembed.ts
│   └── resources/         # リソース実装
│       └── images.ts
├── package.json
├── tsconfig.json
├── README.md
└── .env.example
```

## セキュリティ考慮事項

1. **トークン管理**: 環境変数にアクセストークンを保存し、コードにハードコードしない
2. **入力検証**: すべてのユーザー入力を検証する
3. **エラーハンドリング**: APIエラーを適切に処理し、センシティブな情報を漏らさない
4. **レート制限**: Gyazo APIのレート制限を考慮した実装

## エラーハンドリング

### エラータイプ
- `AuthenticationError`: 認証失敗
- `NotFoundError`: リソースが見つからない
- `ValidationError`: パラメータ検証エラー
- `RateLimitError`: レート制限超過
- `NetworkError`: ネットワークエラー

### エラーレスポンス形式
```typescript
{
  isError: true,
  content: [{
    type: "text",
    text: JSON.stringify({
      error: string,
      message: string,
      statusCode?: number
    })
  }]
}
```

## テスト計画

### 単体テスト
- Gyazo APIクライアントのモック
- 各ツールの動作確認
- エラーケースのテスト

### 統合テスト
- 実際のGyazo APIとの通信テスト（テスト環境）
- MCPクライアントとの接続テスト

## 使用例

### Claude Desktopでの設定

```json
{
  "mcpServers": {
    "gyazo": {
      "command": "node",
      "args": ["/path/to/gyazo-mcp/build/index.js"],
      "env": {
        "GYAZO_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

### AIアシスタントでの使用例

```
ユーザー: "スクリーンショットをGyazoにアップロードして"
アシスタント: [upload_image ツールを使用]

ユーザー: "最近アップロードした画像を見せて"
アシスタント: [list_images ツールを使用]

ユーザー: "画像ID xxxxx の詳細を教えて"
アシスタント: [get_image ツールを使用]
```

## 実装優先順位

### Phase 1: 基本機能
1. プロジェクトセットアップ
2. Gyazo APIクライアント実装
3. upload_image ツール
4. list_images ツール

### Phase 2: 拡張機能
5. get_image ツール
6. delete_image ツール
7. Resources 実装

### Phase 3: 高度な機能
8. get_oembed ツール
9. エラーハンドリングの強化
10. テストの追加

## パフォーマンス考慮事項

- 画像データのストリーミング処理
- キャッシング戦略（画像一覧など）
- 並列リクエストの制御

## 今後の拡張案

1. **画像編集機能**: リサイズ、クロップなど
2. **コレクション管理**: コレクションの作成・管理
3. **検索機能**: OCRを活用した画像検索
4. **統計情報**: アップロード数、ビュー数などの統計
5. **バッチ操作**: 複数画像の一括処理

## 参考資料

- [Gyazo API Documentation](https://gyazo.com/api/docs)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/specification/latest)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Create TypeScript Server CLI](https://github.com/modelcontextprotocol/create-typescript-server)
