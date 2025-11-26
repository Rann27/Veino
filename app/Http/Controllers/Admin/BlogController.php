<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use HTMLPurifier;
use HTMLPurifier_Config;

class BlogController extends Controller
{
    private function sanitizeHtmlContent(string $content): string
    {
        $config = HTMLPurifier_Config::createDefault();
        $config->set('HTML.Allowed', 'p,br,strong,em,b,i,u,h1,h2,h3,h4,h5,h6,ul,ol,li,a[href|title],blockquote,code,pre');
        $purifier = new HTMLPurifier($config);
        return $purifier->purify($content);
    }

    public function index()
    {
        $blogs = Blog::latest()->get();
        
        return Inertia::render('Admin/Blog/Index', [
            'blogs' => $blogs,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Blog/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'show_in_homepage' => 'boolean',
        ]);

        $validated['content'] = $this->sanitizeHtmlContent($validated['content']);
        $validated['show_in_homepage'] = $request->boolean('show_in_homepage');

        Blog::create($validated);

        return redirect()->route('admin.blog.index')->with('success', 'Blog created successfully');
    }

    public function edit(Blog $blog)
    {
        return Inertia::render('Admin/Blog/Edit', [
            'blog' => $blog,
        ]);
    }

    public function update(Request $request, Blog $blog)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'show_in_homepage' => 'boolean',
        ]);

        $validated['content'] = $this->sanitizeHtmlContent($validated['content']);
        $validated['show_in_homepage'] = $request->boolean('show_in_homepage');

        $blog->update($validated);

        return redirect()->route('admin.blog.index')->with('success', 'Blog updated successfully');
    }

    public function destroy(Blog $blog)
    {
        $blog->delete();
        
        return redirect()->route('admin.blog.index')->with('success', 'Blog deleted successfully');
    }
}
