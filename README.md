# envsnap

> CLI tool to snapshot and diff environment variables across deployments

## Installation

```bash
npm install -g envsnap
```

## Usage

Capture a snapshot of your current environment:

```bash
envsnap capture --name production
```

Diff two snapshots to see what changed between deployments:

```bash
envsnap diff production staging
```

Output example:

```
+ NEW_FEATURE_FLAG=true
- OLD_API_URL=https://old.api.example.com
~ DATABASE_POOL_SIZE: 5 → 10
```

Snapshots are saved locally as JSON files and can be committed to version control for tracking environment changes over time.

## Commands

| Command | Description |
|---|---|
| `capture` | Take a snapshot of current env vars |
| `diff <a> <b>` | Compare two named snapshots |
| `list` | List all saved snapshots |
| `delete <name>` | Remove a snapshot |

## License

MIT © [envsnap contributors](https://github.com/envsnap/envsnap)