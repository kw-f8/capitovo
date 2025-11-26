import re

def reorder_checkout():
    file_path = 'checkout.html'
    with open(file_path, 'r') as f:
        content = f.read()

    # 1. Extract the main container content
    # Look for <main ...> ... </main>
    main_match = re.search(r'(<main[^>]*>)(.*?)(</main>)', content, re.DOTALL)
    if not main_match:
        print("Could not find <main> tag")
        return

    main_open_tag = main_match.group(1)
    main_inner = main_match.group(2)
    main_close_tag = main_match.group(3)

    # 2. Extract the two columns
    # The structure is:
    # <div class="max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-8">
    #    <!-- Left Column: Form -->
    #    <div class="md:col-span-2 ..."> ... </div>
    #    <!-- Right Column: Summary -->
    #    <div class="md:col-span-1"> ... </div>
    # </div>

    # We need to be careful with regex matching nested divs. 
    # Since the structure is known and relatively simple, we can try to split by the known comments or classes.
    
    # Find the wrapper div
    wrapper_start_idx = main_inner.find('<div class="max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-8">')
    if wrapper_start_idx == -1:
        print("Could not find wrapper div")
        return
    
    # We will manually parse the blocks to be safe
    
    # Split content into parts
    # Part 1: Form Block
    # It starts with <!-- Left Column: Form -->
    form_start_marker = '<!-- Left Column: Form -->'
    summary_start_marker = '<!-- Right Column: Summary -->'
    
    form_start = main_inner.find(form_start_marker)
    summary_start = main_inner.find(summary_start_marker)
    
    if form_start == -1 or summary_start == -1:
        print("Could not find column markers")
        return

    # The wrapper div closes at the end of main_inner (ignoring whitespace)
    # Let's assume the wrapper div content is everything between the wrapper start tag and the last </div>
    
    # Actually, let's just extract the blocks based on the markers.
    # The Form block is from form_start to summary_start
    # The Summary block is from summary_start to the end of the wrapper content
    
    # We need to find where the wrapper ends.
    # It's safer to just grab the blocks by their content if we can.
    
    # Let's use the fact that the Form block has class "md:col-span-2" and Summary has "md:col-span-1"
    
    # Extract Form Block
    # We'll use a regex that matches the div starting with the class and its content until the next comment or end
    # But regex for nested divs is hard.
    
    # Alternative: Read the file line by line or use a parser.
    # Given the environment, I'll use a simple string manipulation based on the indentation and comments which seem consistent.
    
    lines = content.splitlines()
    
    form_lines = []
    summary_lines = []
    
    in_form = False
    in_summary = False
    
    wrapper_start_line = -1
    wrapper_end_line = -1
    
    for i, line in enumerate(lines):
        if '<div class="max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-8">' in line:
            wrapper_start_line = i
        
        if '<!-- Left Column: Form -->' in line:
            in_form = True
            in_summary = False
            continue
            
        if '<!-- Right Column: Summary -->' in line:
            in_form = False
            in_summary = True
            continue
            
        if in_form:
            # Check if we hit the summary start (handled by continue above) or end of wrapper
            # But we are iterating line by line.
            # The summary start check needs to happen before appending.
            pass
            
    # Let's try a different approach: Split the string by the markers.
    
    parts = main_inner.split(summary_start_marker)
    left_part = parts[0] # Contains wrapper start + Form
    right_part = parts[1] # Contains Summary + wrapper end
    
    # Clean up left_part to get just the Form div
    # It starts after the wrapper div definition
    wrapper_tag = '<div class="max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-8">'
    form_content = left_part.split(wrapper_tag)[1].strip()
    
    # Clean up right_part to get just the Summary div
    # It ends with a closing </div> for the wrapper.
    # We need to remove the last </div>
    summary_content = right_part.rsplit('</div>', 1)[0].strip()
    
    # Now we have form_content and summary_content.
    # We need to modify them.
    
    # 1. Modify Summary Content (Top Box)
    # Remove "md:col-span-1"
    summary_content = summary_content.replace('md:col-span-1', 'w-full')
    # Remove "sticky top-24" as it's not needed if it's at the top
    summary_content = summary_content.replace('sticky top-24', '')
    # Change plan selection container to grid
    summary_content = summary_content.replace('space-y-3', 'grid grid-cols-1 md:grid-cols-3 gap-4')
    
    # 2. Modify Form Content (Bottom Box)
    # Remove "md:col-span-2"
    form_content = form_content.replace('md:col-span-2', 'w-full')
    
    # 3. Construct new Main Inner
    new_wrapper_start = '<div class="max-w-4xl w-full space-y-8">'
    
    new_main_inner = f"""
        {new_wrapper_start}
            
            <!-- Top: Plans (formerly Summary) -->
            {summary_content}

            <!-- Bottom: Form -->
            {form_content}

        </div>
    """
    
    # Replace in content
    new_content = content.replace(main_inner, new_main_inner)
    
    with open(file_path, 'w') as f:
        f.write(new_content)
        
    print("Successfully reordered checkout.html")

if __name__ == "__main__":
    reorder_checkout()
