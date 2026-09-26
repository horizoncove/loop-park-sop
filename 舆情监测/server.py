from flask import Flask, request, jsonify
from playwright.sync_api import sync_playwright
import threading
import time

app = Flask(__name__)

# 全局浏览器实例，保持登录状态
browser_context = None
playwright_instance = None

# 登录状态保存目录（关键！登录态存在这里，下次不用重新登录）
USER_DATA_DIR = r"C:\Users\Administrator\Desktop\LOOP-PARK-SOP\舆情监测\.browser-data"

def init_browser():
    global browser_context, playwright_instance
    if browser_context is None:
        playwright_instance = sync_playwright().start()
        # 用persistent context，登录态会保存到USER_DATA_DIR
        browser_context = playwright_instance.chromium.launch_persistent_context(
            USER_DATA_DIR,
            headless=False,  # 先显示浏览器，方便扫码登录
            viewport={'width': 1280, 'height': 800}
        )
        print("浏览器启动完成，登录态已保存")

@app.route('/')
def index():
    with open('舆情检索工具.html', 'r', encoding='utf-8') as f:
        return f.read()

@app.route('/api/search', methods=['POST'])
def search():
    data = request.json
    keyword = data['keyword']
    use_douyin = data.get('useDouyin', True)
    use_xhs = data.get('useXhs', True)
    
    init_browser()
    
    results = []
    
    if use_douyin:
        # 抖音搜索
        page = browser_context.new_page()
        try:
            page.goto(f"https://www.douyin.com/search/{keyword}?type=video")
            page.wait_for_timeout(3000)
            
            # 滚动加载更多
            for i in range(3):
                page.mouse.wheel(0, 800)
                time.sleep(1)
            
            videos = page.query_selector_all('.search-result-card')
            for v in videos[:10]:
                try:
                    title = v.query_selector('.title').inner_text()
                    author = v.query_selector('.author').inner_text()
                    likes = v.query_selector('.like-count').inner_text()
                    results.append({
                        'platform': '抖音',
                        'title': title,
                        'author': author,
                        'likes': likes
                    })
                except:
                    pass
        except Exception as e:
            results.append({'platform': '抖音', 'error': str(e)})
        finally:
            page.close()
    
    if use_xhs:
        # 小红书搜索
        page = browser_context.new_page()
        try:
            page.goto(f"https://www.xiaohongshu.com/search_result?keyword={keyword}&type=51")
            page.wait_for_timeout(3000)
            
            for i in range(3):
                page.mouse.wheel(0, 800)
                time.sleep(1)
            
            notes = page.query_selector_all('.note-item')
            for n in notes[:10]:
                try:
                    title = n.query_selector('.title').inner_text()
                    author = n.query_selector('.author').inner_text()
                    likes = n.query_selector('.like-count').inner_text()
                    results.append({
                        'platform': '小红书',
                        'title': title,
                        'author': author,
                        'likes': likes
                    })
                except:
                    pass
        except Exception as e:
            results.append({'platform': '小红书', 'error': str(e)})
        finally:
            page.close()
    
    # 生成HTML结果
    html = '<table style="width:100%;border-collapse:collapse;font-size:14px;">'
    html += '<tr style="background:#fafafa;"><th style="padding:10px;text-align:left;">平台</th><th style="padding:10px;text-align:left;">标题</th><th style="padding:10px;text-align:left;">作者</th><th style="padding:10px;text-align:left;">赞数</th></tr>'
    for r in results:
        if 'error' in r:
            html += f'<tr><td colspan="4" style="padding:10px;color:#C62828;">{r["platform"]}：{r["error"]}</td></tr>'
        else:
            tag_color = '#FE2C55' if r['platform'] == '抖音' else '#FF2442'
            html += f'<tr style="border-bottom:1px solid #eee;"><td style="padding:10px;"><span style="color:{tag_color};font-weight:bold;">{r["platform"]}</span></td><td style="padding:10px;">{r["title"]}</td><td style="padding:10px;">{r["author"]}</td><td style="padding:10px;">{r["likes"]}</td></tr>'
    html += '</table>'
    
    return jsonify({'html': html})

if __name__ == '__main__':
    print("=" * 50)
    print("LOOP PARK 舆情检索工具启动中...")
    print("访问地址：http://localhost:5000/")
    print("=" * 50)
    print("首次搜索会自动打开浏览器，请扫码登录抖音和小红书")
    print("登录状态会保存在 .browser-data 目录，下次不用重新登录")
    print("=" * 50)
    
    # 安全：仅监听本机回环，禁止局域网访问（无鉴权服务不得暴露到 0.0.0.0）
    app.run(host='127.0.0.1', port=5000, debug=False, threaded=False)
