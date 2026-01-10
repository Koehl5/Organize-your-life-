from flask import Flask, render_template, request, session, redirect, url_for, flash
import os
import json
from datetime import datetime, timedelta

app = Flask(__name__)
# Security: Use environment variable on server, fall back to dev key locally
app.secret_key = os.environ.get('SECRET_KEY', 'dev_key_only_for_local_testing')

# Ensure data directory exists
DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'complaints.json')
os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)

# In-memory storage for active users
# Format: {ip_address: timestamp}
active_ips = {}

@app.before_request
def track_active_users():
    # Update the timestamp for the current IP
    if request.remote_addr:
        active_ips[request.remote_addr] = datetime.now()

def get_active_user_count():
    # Count IPs active in the last 5 minutes
    threshold = datetime.now() - timedelta(minutes=5)
    # Prune old IPs (optional, strictly speaking, just counting is enough but pruning keeps memory clean)
    # We'll just count for now to avoid modifying dict while iterating if using simple logic
    return sum(1 for timestamp in active_ips.values() if timestamp > threshold)

def load_complaints():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r') as f:
        try:
            return json.load(f)
        except:
            return []

def save_complaint(complaint):
    complaints = load_complaints()
    complaints.append(complaint)
    with open(DATA_FILE, 'w') as f:
        json.dump(complaints, f, indent=4)


@app.route('/')
def home():
    return render_template('index.html')

@app.route('/day')
def day_view():
    return render_template('day.html')

@app.route('/alarms')
def alarms():
    return render_template('alarms.html')

@app.route('/shopping')
def shopping():
    return render_template('shopping.html')

@app.route('/budget')
def budget():
    return render_template('budget.html')

@app.route('/support', methods=['GET', 'POST'])
def support():
    success = False
    if request.method == 'POST':
        # Honeypot check
        if request.form.get('website_url'):
            return "Spam detected", 400
            
        name = request.form.get('name', 'Anonymous')
        ctype = request.form.get('type', 'Other')
        message = request.form.get('message', '')
        
        # Metadata Capture
        user_ip = request.remote_addr or 'Unknown'
        user_agent = request.headers.get('User-Agent', 'Unknown')
        user_lang = request.headers.get('Accept-Language', 'Unknown')
        
        # Basic sanitization
        safe_name = name.replace('<', '&lt;').replace('>', '&gt;')
        safe_message = message.replace('<', '&lt;').replace('>', '&gt;')
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        complaint = {
            'id': int(datetime.now().timestamp() * 1000),
            'timestamp': timestamp,
            'type': ctype,
            'name': safe_name,
            'message': safe_message,
            'metadata': {
                'ip': user_ip,
                'ua': user_agent,
                'lang': user_lang
            }
        }
        
        try:
            save_complaint(complaint)
            success = True
        except Exception as e:
            print(f"Error logging complaint: {e}")
            
    return render_template('support.html', success=success)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if username == 'Koehlcomiskey' and password == 'Brycescott7':
            session['admin_logged_in'] = True
            return redirect(url_for('admin'))
        else:
            flash('Invalid credentials')
            
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('admin_logged_in', None)
    return redirect(url_for('home'))

@app.route('/admin')
def admin():
    if not session.get('admin_logged_in'):
        return redirect(url_for('login'))
        
    complaints = load_complaints()
    # Sort by newest first
    complaints.sort(key=lambda x: x['timestamp'], reverse=True)
    
    active_count = get_active_user_count()
    
    return render_template('admin.html', complaints=complaints, active_users=active_count)


if __name__ == '__main__':
    app.run(debug=True)