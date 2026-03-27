import re

file_path = r"c:\Users\ABC\Downloads\Avica-2.0\frontend\src\pages\Signup.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Imports
imp_find = '''import { GoogleLogin } from "@react-oauth/google";'''
imp_replace = '''import { GoogleLogin } from "@react-oauth/google";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";'''
content = content.replace(imp_find, imp_replace)

# 2. Input to DatePicker
input_find = '''                      <input
                        type="date"
                        id="birthDate"
                        name="birthDate"
                        value={formData.birthDate}
                        onChange={handleChange}
                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                        min={new Date(new Date().setFullYear(new Date().getFullYear() - 100)).toISOString().split('T')[0]}
                        className={`w-full px-4 py-3.5 bg-gray-900 border ${errors.birthDate ? "border-red-600" : "border-gray-700"} rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/50 transition-all duration-300`}
                      />'''

input_replace = '''                      <DatePicker
                        selected={formData.birthDate ? new Date(formData.birthDate) : null}
                        onChange={(date) => {
                          const dateString = date ? date.toISOString().split('T')[0] : "";
                          handleChange({ target: { name: 'birthDate', value: dateString } });
                        }}
                        maxDate={new Date(new Date().setFullYear(new Date().getFullYear() - 18))}
                        minDate={new Date(new Date().setFullYear(new Date().getFullYear() - 100))}
                        showYearDropdown
                        showMonthDropdown
                        dropdownMode="select"
                        placeholderText="Select your birth date"
                        className={`w-full px-4 py-3.5 bg-gray-900 border ${errors.birthDate ? "border-red-600" : "border-gray-700"} rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/50 transition-all duration-300`}
                        wrapperClassName="w-full"
                      />'''
content = content.replace(input_find, input_replace)

# 3. CSS Styling
new_styles = '''
        .react-datepicker-wrapper {
          width: 100%;
        }
        .react-datepicker {
          font-family: inherit;
          background-color: #111827;
          border: 1px solid #374151;
          border-radius: 1rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          color: #fff;
          padding: 10px;
        }
        .react-datepicker__header {
          background-color: transparent;
          border-bottom: 1px solid #374151;
          padding-top: 10px;
        }
        .react-datepicker__current-month, .react-datepicker-time__header, .react-datepicker-year-header {
          color: #fff;
          font-weight: 700;
          font-size: 1.1rem;
        }
        .react-datepicker__day-name, .react-datepicker__day, .react-datepicker__time-name {
          color: #d1d5db;
          width: 2.5rem;
          line-height: 2.5rem;
          margin: 0.2rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }
        .react-datepicker__day:hover, .react-datepicker__month-text:hover, .react-datepicker__quarter-text:hover, .react-datepicker__year-text:hover {
          background-color: #374151;
          color: #fff;
        }
        .react-datepicker__day--selected, .react-datepicker__day--in-selecting-range, .react-datepicker__day--in-range {
          background-color: #dc2626 !important;
          color: #fff !important;
          font-weight: bold;
        }
        .react-datepicker__day--keyboard-selected {
          background-color: #b91c1c;
        }
        .react-datepicker__triangle {
          display: none;
        }
        .react-datepicker__navigation-icon::before {
          border-color: #9ca3af;
        }
        .react-datepicker__navigation:hover *::before {
          border-color: #fff;
        }
        .react-datepicker__month-select, .react-datepicker__year-select {
          background-color: #1f2937;
          color: #fff;
          border: 1px solid #4b5563;
          border-radius: 0.5rem;
          padding: 4px 8px;
          outline: none;
          cursor: pointer;
        }
        .react-datepicker__month-select:focus, .react-datepicker__year-select:focus {
          border-color: #dc2626;
        }
        .react-datepicker__day--disabled {
          color: #4b5563 !important;
        }
        .react-datepicker__day--disabled:hover {
          background-color: transparent !important;
          color: #4b5563 !important;
        }
'''

content = content.replace('      <style>{`', '      <style>{`' + new_styles)

# 4. Remove previous old css
old_css_find = '''        input[type="date"] {
          color-scheme: dark;
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          background-color: #dc2626;
          padding: 6px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        input[type="date"]::-webkit-calendar-picker-indicator:hover {
          background-color: #b91c1c;
          transform: scale(1.05);
        }'''

content = content.replace(old_css_find, '')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Update 3 for gorgeous react-datepicker done.")
