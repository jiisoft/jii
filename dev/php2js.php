<meta charset="utf-8">
<form method="GET" action="">
    <input name="file" size="50" value="<?= @$_GET['file']; ?>" />
    <input type="submit" />
</form>
<br />

<pre>
<?php

if (empty($_GET['file'])) {
    exit();
}

$sourceCode = file_get_contents($_GET['file']);
$namespace = 'Jii.sql';

$classNamesMap = [
    'yii.db' => 'Jii.sql',
];

// Store namespace
preg_match('/\n *namespace ([^;]+);/', $sourceCode, $matches);
$namespace = isset($matches[1]) ? str_replace('\\', '.', $matches[1]) : '';
if (isset($classNamesMap[$namespace])) {
    $namespace = $classNamesMap[$namespace];
}


// Class namespaces
$classNames = [];
preg_match_all('/\n *use ([^;]+);\n/', $sourceCode, $matches);
foreach ($matches[1] as $className) {
    $className = str_replace('\\', '.', $className);
    if (strpos($className, '.') === false) {
        $className = $namespace . '.' . $className;
    }
    foreach ($classNamesMap as $from => $to) {
        if (strpos($className, $from) === 0) {
            $className = $to . substr($className, strlen($from));
        }
    }
    $classNames[] = $className;

}


// Methods
$sourceCode = preg_replace_callback('/(public|private|protected) (static )?function *([^(]+) *\(([^(]*)\)\r?\n    {/', function($matches) {
    $args = preg_split('/\s*,\s*/', trim($matches[4]), -1, PREG_SPLIT_NO_EMPTY);
    $defaults = [];
    foreach ($args as $i => $arg) {
         if (preg_match('/\$([^ ]+)( = (null|true|false|\[\]|))/', $arg, $argMatches)) {
             $args[$i] = $argMatches[1];
             if ($argMatches[2]) {
                 if ($argMatches[3] === '') {
                     $argMatches[3] = "''";
                 }
                 $defaults[] = $argMatches[1] . ' = ' . $argMatches[1] . ' || ' . $argMatches[3] . ';';
             }
         } else {
             $args[$i] = str_replace('$', '', $args[$i]);
         }
    }

    return ($matches[1] !== 'public' ? '_' : '') . $matches[2] . $matches[3] .
        ': function (' . implode(', ', $args) . ') {' .
        (count($defaults) ? "\n        " . implode("\n        ", $defaults) . "\n" : '');
}, $sourceCode);


// Types in docs
$sourceCode = preg_replace_callback('/@(return|param|var) ([^\s]+)/', function($matches) {
    $tagsMap = [
        'var' => 'type',
        'return' => 'returns',
    ];
    $tag = isset($tagsMap[$matches[1]]) ? $tagsMap[$matches[1]] : $matches[1];

    $typesMap = [
        'bool' => 'boolean',
        'integer' => 'number',
        'array' => '[]',
    ];
    $types = preg_split('/\|/', $matches[2]);
    foreach ($types as $i => $type) {
        if (isset($typesMap[$type])) {
            $types[$i] = $typesMap[$type];
            continue;
        }
        
        if (preg_match('/^[A-Z][a-zA-Z0-9_-]+$/', $type)) {
            $isFined = false;
            foreach ($GLOBALS['classNames'] as $className) {
                if (preg_match('/\.' . $type . '$/', $className)) {
                    $types[$i] = $className;
                    $isFined = true;
                    break;
                }
            }

            if (!$isFined) {
                $types[$i] = $GLOBALS['namespace'] . '.' . $type;
            }
        }
    }

    return "@" . $tag . " {" . implode('|', $types) . "}";
}, $sourceCode);


// Foreach
function find_foreaches($input) {
    $start = strpos($input, 'foreach');
    if ($start === false) {
        return [];
    }

    $substrings = array();
    $paren_count = false;
    $cur_string = '';
    for ($i = $start; $i < strlen($input); $i++) {
        $char = $input[$i];

        if ($char == '{') {
            $paren_count += 1;
        } elseif ($char == '}') {
            $paren_count -= 1;
        }

        $cur_string .= $char;

        if ($paren_count === 0 && strlen($cur_string)) {
            $substrings[] = $cur_string;
            $cur_string = '';
            $paren_count = false;

            $i = strpos($input, 'foreach', $i);
            if ($i === false) {
                break;
            }
            $i--;
        }
    }
    return $substrings;
}
foreach(find_foreaches($sourceCode) as $for) {
    if (preg_match('/foreach \(\$([^ ]+) as (\$([^ ]+) => )?\$([^ ]+)\)/', $for, $matches)) {
        $list = $matches[1];
        $key = $matches[3];
        $value = $matches[4];

        $newFor = str_replace($matches[0], 'Jii._.each(' . $list . ', function(' . $value . ($key ? ', ' . $key : '') . ')', $for);
        $newFor = preg_replace('/}$/', '}.bind(this));', $newFor);

        $sourceCode = str_replace($for, $newFor, $sourceCode);
    }
}


// Arrays as object
function find_arrays($input) {
    $start = strpos($input, '[');
    if ($start === false) {
        return [];
    }

    $substrings = array();
    $paren_count = false;
    $cur_string = '';
    for ($i = $start; $i < strlen($input); $i++) {
        $char = $input[$i];

        if ($char == '[') {
            $paren_count += 1;
        } elseif ($char == ']') {
            $paren_count -= 1;
        }

        $cur_string .= $char;

        if ($paren_count === 0 && strlen($cur_string)) {
            $substrings[] = $cur_string;
            $cur_string = '';
            $paren_count = false;

            $i = strpos($input, '[', $i);
            if ($i === false) {
                break;
            }
            $i--;
        }
    }
    return $substrings;
}
foreach(find_arrays($sourceCode) as $arr) {
    if (strpos($arr, ' => ') === false) {
        continue;
    }

    $newArr = preg_replace('/\'([a-z_0-9]+)\' => /i', '\\1 => ', $arr);
    $newArr = preg_replace('/ => /', ': ', $newArr);
    $newArr = '{' . trim(trim($newArr, '['), ']') . '}';
    $newArr = preg_replace('/,(\s*})$/', '\\1', $newArr);

    $sourceCode = str_replace($arr, $newArr, $sourceCode);
}


$sourceCode = trim($sourceCode) . ');';


// Single replaces
$replaces = [
    '/<\?(php)?\r?\n/' => '',
    '/\r/' => '',
    '/\n *(use|namespace) [^;]+;/' => '',
    '/class ([^ ]+) extends ([^ ]+).*\n{/' => "Jii.defineClass('" . $namespace . ".$1', {\n\n    __extends: 'Jii.base.$2',\n\n    __static: {\n    },",
    '/public \$([^; ]+).*/' => "$1: null,\n",
    '/(private|protected) function ([^(]+)(.*)/' => "_$1: function $2",
    '/empty\(/' => 'Jii._.isEmpty(',
    '/is_array\(/' => 'Jii._.isArray(',
    '/is_string\(/' => 'Jii._.isString(',
    '/is_integer\(/' => 'Jii._.isNumber(',
    '/::/' => '.',
    '/\$/' => '',
    '/\.=/' => '+=',
    '/elseif/' => 'else if',
    '/```php/' => '```js',
    '/\[\] = ([^;]+)/' => '.push($1)',
    '/->/' => '.',
    '/(new [a-z\.]+)([^(a-z\.])/i' => '\\1()\\2',
    '/Yii/' => 'Jii',
    '/yii/' => 'jii',
    '/(\n    })\n/' => "\\1,\n",
    '/(\n    }),(\n}\);)$/' => "\\1\\2",
];
$sourceCode = preg_replace(array_keys($replaces), array_values($replaces), $sourceCode);

echo $sourceCode;