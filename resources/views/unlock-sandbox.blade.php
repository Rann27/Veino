<!DOCTYPE html>
{{--
    Stand-in for the Move2Link gate, used only when sandbox mode is on.

    It looks deliberately unlike the rest of the site: if this ever shows up on
    the live site it should be unmistakable at a glance, not something a reader
    could mistake for the real challenge.
--}}
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Sandbox Challenge — VeiNovel</title>
    <style>
        :root { color-scheme: dark; }
        * { box-sizing: border-box; }
        body {
            margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
            padding: 24px; background: #14110c; color: #f5eee2;
            font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
        }
        .card {
            width: 100%; max-width: 440px; background: #1e1a12; border: 1px solid #4a3d1e;
            border-radius: 16px; padding: 28px; text-align: center;
        }
        .tag {
            display: inline-block; padding: 5px 12px; border-radius: 999px; margin-bottom: 18px;
            background: rgba(250,178,25,0.12); color: #fab219;
            font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
        }
        h1 { margin: 0 0 10px; font-size: 19px; }
        p { margin: 0 0 8px; font-size: 13.5px; line-height: 1.6; color: #c9c0ad; }
        .meta { margin: 18px 0; padding: 12px; border-radius: 10px; background: rgba(255,255,255,0.03); font-size: 12.5px; text-align: left; }
        .meta div { display: flex; justify-content: space-between; gap: 12px; padding: 3px 0; }
        .meta span:last-child { color: #f5eee2; font-weight: 600; }
        .btn {
            display: block; width: 100%; margin-top: 18px; padding: 12px; border: 0; border-radius: 10px;
            background: #1baf7a; color: #fff; font-size: 14px; font-weight: 700; cursor: pointer;
            text-decoration: none; transition: opacity .15s;
        }
        .btn:disabled { opacity: .55; cursor: not-allowed; }
        .cancel { display: inline-block; margin-top: 14px; font-size: 12.5px; color: #8d8674; text-decoration: none; }
        .warn { margin-top: 16px; font-size: 11.5px; color: #fab219; }
    </style>
</head>
<body>
    <div class="card">
        <span class="tag">Sandbox — not the real challenge</span>
        <h1>Simulated ad gate</h1>
        <p>Move2Link is bypassed. Continuing grants the same access a completed challenge would, so the rest of the flow can be tested.</p>

        <div class="meta">
            <div><span>Series</span><span>{{ $series->title }}</span></div>
            <div><span>Chapter</span><span>{{ $chapter->title ?: 'Chapter '.$chapter->chapter_number }}</span></div>
            <div><span>Grants access for</span><span>{{ $days }} day{{ $days === 1 ? '' : 's' }}</span></div>
        </div>

        <button class="btn" id="go" disabled>Continue in <span id="count">3</span>s</button>
        <a class="cancel" href="{{ $cancelUrl }}">Cancel and go back</a>

        <p class="warn">Turn sandbox off in Series Management → Settings before going live.</p>
    </div>

    <script>
        // A short pause stands in for the real gate — long enough to feel like a
        // step, short enough not to waste the tester's time.
        var left = 3;
        var btn = document.getElementById('go');
        var count = document.getElementById('count');
        var target = @json($claimUrl);

        var timer = setInterval(function () {
            left -= 1;
            if (left > 0) { count.textContent = left; return; }
            clearInterval(timer);
            btn.disabled = false;
            btn.textContent = 'Continue';
        }, 1000);

        btn.addEventListener('click', function () {
            btn.disabled = true;
            btn.textContent = 'Unlocking…';
            window.location.href = target;
        });
    </script>
</body>
</html>
